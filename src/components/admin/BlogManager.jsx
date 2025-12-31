"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AuthGuard from '@/components/AuthGuard';
import { 
  FileText, Loader2, Upload, XCircle, Edit2, Trash2, 
  Search, Calendar, ExternalLink, Plus, Tag, Check,
  Image as ImageIcon, Type, Globe, Lock, X, Shield, ShieldCheck, Clock
} from 'lucide-react';

export default function BlogManager() {
  // --- Auth & User State ---
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); // MySQL user data (role, etc)
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Data State ---
  const [blogs, setBlogs] = useState([]);
  const [blogTypes, setBlogTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'approvals'
  
  // --- UI/Loading State ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingType, setIsAddingType] = useState(false); 

  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);

  const initialForm = { 
    heading: '', 
    sub_heading: '', 
    content: '', 
    external_link: '', 
    blog_type_id: '', 
    category: 'public', 
    photo_url: '' 
  };
  const [formData, setFormData] = useState(initialForm);
  const [newTypeName, setNewTypeName] = useState('');

  // 1. Auth & Role Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        // Fetch Role from MySQL
        try {
          const res = await fetch('/api/auth/check-role', {
            method: 'POST',
            body: JSON.stringify({ uid: currentUser.uid })
          });
          const userData = await res.json();
          setDbUser(userData);
          setIsAdmin(userData.role === 'admin');
        } catch (err) {
          console.error("Role fetch failed", err);
        }
      } else {
        setDbUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Blog Types
  const fetchBlogTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blogs/types'); 
      if (res.ok) {
        const data = await res.json();
        setBlogTypes(data);
        if (data.length > 0 && !formData.blog_type_id) {
          setFormData(prev => ({ ...prev, blog_type_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch types", error);
    }
  }, []);

  // 3. Fetch blogs (Dynamic based on View & Role)
  const fetchBlogs = useCallback(async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    
    // Determine what logic to send to API
    let apiView = 'mine'; 
    if (isAdmin && viewMode === 'list') apiView = 'all'; // Admin sees all in list
    if (isAdmin && viewMode === 'approvals') apiView = 'pending'; // Admin sees pending in approvals tab

    try {
      const res = await fetch(`/api/admin/blogs?search=${searchQuery}&uid=${firebaseUser.uid}&view=${apiView}`);
      if (res.ok) setBlogs(await res.json());
    } catch (error) {
      console.error("Failed to fetch blogs", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, firebaseUser, isAdmin, viewMode]);

  // Initial Data Loads
  useEffect(() => {
    fetchBlogTypes();
  }, [fetchBlogTypes]);

  // Refresh list when user/mode changes
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Upload Logic
  const handleFileUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('blog-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseUser) return alert("Please login first");

    setIsSubmitting(true);
    try {
      let photoUrl = formData.photo_url;
      if (file) photoUrl = await handleFileUpload(file);

      const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          photo_url: photoUrl, 
          author_uid: firebaseUser.uid 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      
      alert(isAdmin ? "Published successfully!" : "Submitted for approval!");
      
      setFormData(initialForm);
      setFile(null);
      setEditingId(null);
      setViewMode('list'); // Go back to list
      fetchBlogs();
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  // Add New Type Logic
  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const res = await fetch('/api/admin/blogs/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName }) 
      });
      if (res.ok) {
        await fetchBlogTypes();
        setNewTypeName('');
        setIsAddingType(false);
      }
    } catch (error) { console.error(error); }
  };

  // Delete Logic
  const handleDelete = async (id) => {
    if(!confirm("Are you sure? This cannot be undone.")) return;
   await fetch(`/api/admin/blogs/${id}?requester=${firebaseUser.uid}`, { method: 'DELETE' });
    fetchBlogs();
  };

  // Approve Logic (Admin Only)
  const handleApprove = async (id) => {
    if(!confirm("Approve this article for public view?")) return;
    try {
        await fetch(`/api/admin/blogs/${id}`, { 
            method: 'PUT',
            body: JSON.stringify({ status_only: true, status: 'active',userUid: firebaseUser.uid,blogid:id,heading: blogs.find(b => b.id === id)?.heading,author_uid: blogs.find(b => b.id === id)?.author_uid   }
            )
        });
        fetchBlogs();
    } catch(e) { console.error(e); }
  };

  const handleEdit = (blog) => {
    setFormData({
      heading: blog.heading,
      sub_heading: blog.sub_heading,
      content: blog.content,
      external_link: blog.external_link || '',
      blog_type_id: blog.blog_type_id,
      category: blog.category,
      photo_url: blog.photo_url
    });
    setEditingId(blog.id);
    setFile(null); 
    setViewMode('create'); // Switch to form view
  };

  const groupedBlogs = blogs.reduce((acc, blog) => {
    const typeName = blog.type_name || 'Uncategorized';
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(blog);
    return acc;
  }, {});

  // --- Render ---

  if (!dbUser) return (
     <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center">
             <Loader2 className="animate-spin w-10 h-10 text-blue-600 mx-auto mb-4"/>
             <p className="text-gray-500">Checking permissions...</p>
         </div>
     </div>
  );

  return (<AuthGuard allowedRoles={['admin', 'creator', 'editor']}>
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans ">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & User Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-600">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {isAdmin ? <ShieldCheck className="text-blue-600"/> : <FileText className="text-blue-600"/>}
                    {isAdmin ? "Admin Dashboard" : "Creator Studio"}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {isAdmin ? "Manage all content and approvals." : "Write and track your articles."}
                </p>
            </div>
            
            <div className="flex items-center gap-3 mt-4 md:mt-0 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <img 
                   src={dbUser.photoUrl || firebaseUser.photoURL} 
                   alt="Profile" 
                   className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="pr-2">
                    <p className="text-sm font-bold text-gray-900">{dbUser.fullName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 uppercase tracking-wide">
                        {dbUser.role} • {dbUser.churchName}
                    </p>
                </div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-300 w-fit">
            <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-100 text-gray-900' : 'text-gray-500 hover:text-gray-900  hover:bg-blue-100'}`}
            >
                {isAdmin ? "All Articles" : "My Library"}
            </button>
            
            {isAdmin && (
                <button 
                    onClick={() => setViewMode('approvals')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'approvals' ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:text-gray-900 hover:bg-red-100'}`}
                >
                    <Shield size={14}/> Pending Approvals
                </button>
            )}

            <button 
                onClick={() => { setEditingId(null); setFormData(initialForm); setViewMode('create'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-blue-100'}`}
            >
                <Plus size={16}/> New Article
            </button>
        </div>

        {/* --- VIEW: FORM (Create/Edit) --- */}
        {viewMode === 'create' && (
           <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 md:p-8">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-blue-900">{editingId ? 'Edit Article' : 'Compose New Article'}</h2>
                 <button onClick={() => setViewMode('list')} className="text-gray-400 hover:text-gray-600"><X/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-8">
                 {/* ... (Keep existing form fields: Image, Heading, Subheading) ... */}
                 
                 {/* Reusing your exact form layout here for brevity, assume same JSX structure as provided in prompt for inputs */}
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                       {/* Image Upload Logic from your code */}
                       <div onClick={() => document.getElementById('fileInput').click()} className={`cursor-pointer w-full aspect-[4/3] rounded-xl border-2 border-dashed flex items-center justify-center bg-gray-50 relative overflow-hidden ${file || formData.photo_url ? 'border-blue-500' : 'border-gray-300'}`}>
                           {file || formData.photo_url ? (
                               <img src={file ? URL.createObjectURL(file) : formData.photo_url} className="absolute inset-0 w-full h-full object-cover"/>
                           ) : (
                               <div className="text-center p-4">
                                   <Upload className="mx-auto text-gray-400 mb-2"/>
                                   <p className="text-sm text-gray-500">Upload Cover</p>
                               </div>
                           )}
                           <input id="fileInput" type="file" className="hidden" onChange={e => setFile(e.target.files[0])}/>
                       </div>
                    </div>
                    
                    <div className="lg:col-span-8 text-blue-900 space-y-4">
                       <input 
                         placeholder="Heading" 
                         className="w-full text-xl font-bold border-b border-gray-200 py-2 outline-none focus:border-blue-500" 
                         value={formData.heading} 
                         onChange={e => setFormData({...formData, heading: e.target.value})} 
                         required
                       />
                       <input 
                         placeholder="Sub Heading" 
                         className="w-full text-blue-900 border-b border-gray-200  py-2 outline-none focus:border-blue-500" 
                         value={formData.sub_heading} 
                         onChange={e => setFormData({...formData, sub_heading: e.target.value})} 
                       />
                       
                       {/* Category Select Logic */}
                       <div className="flex gap-4">
                           <div className="flex-1">
                               <label className="text-xs font-bold text-blue-900">Type</label>
                               <select 
                                 className="w-full p-2 bg-gray-100 text-blue-900 rounded-lg"
                                 value={formData.blog_type_id}
                                 onChange={e => setFormData({...formData, blog_type_id: e.target.value})}
                                 required
                               >
                                  <option value="" className='text-gray-900'>Select Type</option>
                                  {blogTypes.map(t => <option key={t.id} value={t.id} >{t.type_name}</option>)}
                               </select>
                           </div>
                           
                           <div className="flex-1">
                               <label className="text-xs font-bold text-blue-900">Visibility</label>
                               <select 
                                 className="w-full p-2 bg-gray-100 rounded-lg"
                                 value={formData.visibility}
                                 onChange={e => setFormData({...formData, visibility: e.target.value})}
                               >
                                
                                  <option value="public">Public</option>
                                  <option value="private">Private</option>
                               </select>
                           </div>
                           {/* Add Type Button */}
                           <button type="button" onClick={() => setIsAddingType(!isAddingType)} className="mt-6 p-2 border rounded-lg hover:bg-gray-100"><Plus size={18}/></button>
                       </div>
                       
                       {isAddingType && (
                           <div className="flex gap-2 animate-in fade-in">
                               <input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="New Type Name" className="border p-2 rounded-lg text-sm"/>
                               <button type="button" onClick={handleAddType} className="bg-blue-600 text-white p-2 rounded-lg text-sm">Add</button>
                           </div>
                       )}

                       <textarea 
                          className="w-full h-64 p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                          placeholder="Write your story..."
                          value={formData.content}
                          onChange={e => setFormData({...formData, content: e.target.value})}
                          required
                       />
                       
                       <input 
                         placeholder="External Link (Optional)" 
                         className="w-full text-sm border-b border-gray-200 py-2 outline-none text-blue-600" 
                         value={formData.external_link} 
                         onChange={e => setFormData({...formData, external_link: e.target.value})} 
                       />
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-6 border-t">
                    <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2 text-gray-500 font-medium">Cancel</button>
                    <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="px-8 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
                    >
                       {isSubmitting ? <Loader2 className="animate-spin"/> : isAdmin ? "🚀 Publish Now" : "📤 Submit for Approval"}
                    </button>
                 </div>
               </form>
             </div>
           </div>
        )}

        {/* --- VIEW: LIST / APPROVALS --- */}
        {(viewMode === 'list' || viewMode === 'approvals') && (
            <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={20}/>
                    <input 
                       className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300  text-blue-800 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                       placeholder="Search your library..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-blue-500"/></div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No articles found.</p>
                    </div>
                ) : (
                    Object.entries(groupedBlogs).map(([type, typeBlogs]) => (
                        <div key={type}>
                             <h3 className="font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span> {type}
                             </h3>
                             <div className="grid gap-4">
                                {typeBlogs.map(blog => (
                                    <div key={blog.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-5 group hover:border-blue-300 transition-all">
                                        <div className="w-full md:w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                                            {blog.photo_url ? <img src={blog.photo_url} className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center text-gray-300"><ImageIcon/></div>}
                                            
                                            {/* STATUS BADGE */}
                                            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm
                                                ${blog.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {blog.status}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg text-gray-900 truncate">{blog.heading}</h4>
                                            <p className="text-blue-600 text-sm mb-1">{blog.sub_heading}</p>
                                            <p className="text-gray-500 text-sm line-clamp-2">{blog.content}</p>
                                            
                                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(blog.created_at).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 text-gray-600 font-medium">
                                                    <img src={blog.author_photo || 'https://via.placeholder.com/20'} className="w-4 h-4 rounded-full"/>
                                                    {blog.author_name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex md:flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                                            {/* Approve Button (Only Admin & Pending) */}
                                            {isAdmin && blog.status === 'pending' && (
                                                <button onClick={() => handleApprove(blog.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white" title="Approve">
                                                    <Check size={18}/>
                                                </button>
                                            )}
                                            
                                            {/* Edit/Delete (Admins or Authors) */}
                                            {(isAdmin || firebaseUser.uid === blog.author_uid) && (
                                                <>
                                                    <button onClick={() => handleEdit(blog)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"><Edit2 size={18}/></button>
                                                    <button onClick={() => handleDelete(blog.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white"><Trash2 size={18}/></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))
                )}
            </div>
        )}

      </div>
    </div>
    </AuthGuard>
  );
}