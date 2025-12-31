"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Book, Loader2, Upload, XCircle, Edit2, Trash2, Users } from 'lucide-react';

import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';


const groupByCategory = (data, key) => {
  return data.reduce((acc, item) => {
    const category = item[key] || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
};

export default function BookManager() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [userId, setUserId] = useState(null);
const [userRole, setUserRole] = useState(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      // 1. Set User ID
      setUserId(currentUser.uid);

      // 2. Fetch Role from Database
      try {
        const res = await fetch('/api/auth/check-role', {
          method: 'POST',
          body: JSON.stringify({ uid: currentUser.uid })
        });
        const data = await res.json();
        
        // 3. Set Role
        setUserRole(data.role); 
      } catch (err) {
        console.error("Role fetch failed", err);
      }
    } else {
      // Reset if logged out
      setUserId(null);
      setUserRole(null);
    }
  });

  return () => unsubscribe();
}, []);
  
  const initialForm = { 
      title: '', author: '', pages: '', stock_status: 'in_stock', 
      publish_year: '', description: '', image_url: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchBooks = useCallback(async () => {
    const res = await fetch('/api/admin/books');
    if (res.ok) setBooks(await res.json());
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleFileUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('book').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('book').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.image_url;
      if (file) finalImageUrl = await handleFileUpload(file); 

      const url = editingId ? `/api/admin/books/${editingId}` : '/api/admin/books';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, image_url: finalImageUrl,userId: userId })
      });

      if (!res.ok) throw new Error("Operation failed");
      
      alert(editingId ? "Book updated!" : "Book added to Library!");
      setFormData(initialForm);
      setFile(null);
      setEditingId(null);
      fetchBooks();
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if(!confirm("Remove book from library?")) return;
    await fetch(`/api/admin/books/${id}?userId=${userId}`, { method: 'DELETE' });
    fetchBooks();
  };

  const handleEdit = (book) => {
      setFormData(book);
      setEditingId(book.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const groupedBooks = groupByCategory(books, 'author');

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-amber-600">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
             <Book className="text-amber-600"/> {editingId ? 'Edit Book' : 'Add Book to Ministry'}
           </h2>
           {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData(initialForm); setFile(null)}} className="text-sm text-gray-500 flex items-center"><XCircle size={16} className="mr-1"/> Cancel</button>}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
              <div className="border-2 border-dashed border-amber-200 p-4 rounded-lg text-center h-48 flex flex-col justify-center items-center bg-amber-50 relative overflow-hidden">
                  {file ? (
                      <img src={URL.createObjectURL(file)} className="absolute inset-0 w-full h-full object-contain" />
                  ) : formData.image_url ? (
                      <img src={formData.image_url} className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                      <div className="text-amber-400"><Book size={40} className="mx-auto mb-2 opacity-50"/></div>
                  )}
                  <label className="cursor-pointer z-10 bg-white/80 hover:bg-white px-3 py-1 rounded shadow text-sm font-medium text-amber-700 mt-auto mb-2">
                     {file ? 'Change Cover' : 'Upload Cover'}
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                  </label>
              </div>
              <div className="bg-white border rounded shadow p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Preview Card</p>
                  <h4 className="font-bold text-gray-800 truncate">{formData.title || "Book Title"}</h4>
                  <p className="text-sm text-gray-600">{formData.author || "Author Name"}</p>
                  <div className="flex justify-between mt-2 text-xs">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{formData.publish_year || "Year"}</span>
                      <span className={`px-2 py-0.5 rounded ${formData.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {formData.stock_status === 'in_stock' ? 'In Stock' : 'Out'}
                      </span>
                  </div>
              </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Book Title</label>
                  <input required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Author</label>
                  <input required className="input-field" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>

              <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Availability</label>
                  <select className="input-field" value={formData.stock_status} onChange={e => setFormData({...formData, stock_status: e.target.value})}>
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre Order</option>
                  </select>
              </div>

              <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Publish Year</label>
                  <input type="number" className="input-field" value={formData.publish_year} onChange={e => setFormData({...formData, publish_year: e.target.value})} />
              </div>

              <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Pages</label>
                  <input type="number" className="input-field" value={formData.pages} onChange={e => setFormData({...formData, pages: e.target.value})} />
              </div>

              <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                  <textarea className="input-field" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="col-span-2">
                  <button disabled={isSubmitting} className="btn-primary bg-amber-600 hover:bg-amber-700 w-full">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : (editingId ? "Update Book Details" : "Add to Library")}
                  </button>
              </div>
          </div>
        </div>
      </form>

      <div className="space-y-8">
          {Object.keys(groupedBooks).length === 0 && !isLoading && <div className="text-center text-gray-500 py-8">Library is empty.</div>}
          
          {Object.keys(groupedBooks).sort().map(author => (
              <div key={author} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
                      <Users size={18} className="mr-2 text-amber-500"/> {author}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedBooks[author].map(book => (
                          <div key={book.id} className="flex gap-3 p-3 border rounded-lg hover:shadow-md transition bg-gray-50 group">
                              <div className="w-16 h-24 bg-gray-200 flex-shrink-0 overflow-hidden rounded shadow-sm">
                                  {book.image_url ? (
                                      <img src={book.image_url} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400"><Book size={20}/></div>
                                  )}
                              </div>
                              <div className="flex-grow min-w-0">
                                  <h4 className="font-bold text-gray-900 truncate">{book.title}</h4>
                                  <p className="text-xs text-gray-500 mb-1">{book.publish_year} • {book.pages} Pages</p>
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${book.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {book.stock_status.replace(/_/g, ' ')}
                                  </span>
                              </div>
                              <div className="flex flex-col gap-2 justify-center border-l pl-2">
                                   <button onClick={() => handleEdit(book)} className="text-blue-500 hover:bg-blue-100 p-1.5 rounded"><Edit2 size={16}/></button>
                                   <button onClick={() => handleDelete(book.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 size={16}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}