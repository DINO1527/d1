"use client";
import { useState, useEffect, useCallback } from 'react';
import { Video, Loader2, Save, XCircle, Trash2, Edit2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
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

export default function VideoManager() {
  const [videos, setVideos] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [editingId, setEditingId] = useState(null);
      
      const initialForm = { heading: '', sub_heading: '', description: '', youtube_link: '', video_type: 'sermon', category: 'public' };
      const [formData, setFormData] = useState(initialForm);

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
  
      const fetchVideos = useCallback(async () => {
        const res = await fetch('/api/admin/videos');
        if (res.ok) setVideos(await res.json());
        setIsLoading(false);
      }, []);
  
      useEffect(() => { fetchVideos(); }, [fetchVideos]);
  
      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
          let embed = formData.youtube_link; 
          if(formData.youtube_link.includes('watch?v=')) embed = `https://www.youtube.com/embed/${formData.youtube_link.split('v=')[1].split('&')[0]}`;
          else if (formData.youtube_link.includes('youtu.be/')) embed = `https://www.youtube.com/embed/${formData.youtube_link.split('youtu.be/')[1]}`;
  
          const url = editingId ? `/api/admin/videos/${editingId}` : '/api/admin/videos';
          const method = editingId ? 'PUT' : 'POST';
  
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, embed_code: embed,userId: userId})
          });
          
          if (!res.ok) throw new Error("Operation failed");
          alert(editingId ? "Video updated!" : "Video published!");
          setFormData(initialForm);
          setEditingId(null);
          fetchVideos();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
      };
  
      const handleDelete = async (id) => {
        if(!confirm("Are you sure you want to delete this video?")) return;
        await fetch(`/api/admin/videos/${id}?userId=${userId}`, { method: 'DELETE' });
        fetchVideos();
      };
  
      const handleEdit = (video) => {
        setFormData({
          heading: video.heading, sub_heading: video.sub_heading, description: video.description,
          youtube_link: video.youtube_link, video_type: video.video_type, category: video.category
        });
        setEditingId(video.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
  
      const groupedVideos = groupByCategory(videos, 'video_type');
  
      return (<AuthGuard allowedRoles={['admin', 'editor']}>
        <div className="space-y-8">
         <form 
          onSubmit={handleSubmit} 
            className="bg-white p-6 rounded-xl shadow-md border-t-4 border-red-600"
  >
    {/* HEADER */}
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Video className="text-red-600" />
        {editingId ? "Edit Video" : "Upload Video"}
      </h2>
  
      {editingId && (
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setFormData(initialForm);
          }}
          className="text-sm text-gray-700 hover:underline flex items-center"
        >
          <XCircle size={16} className="mr-1" />
          Cancel Edit
        </button>
      )}
    </div>
  
    {/* MAIN 2-COLUMN LAYOUT */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  
      {/* LEFT SIDE – FORM FIELDS */}
      <div className="space-y-4 " >
  
        <div className="grid grid-cols-1 gap-4 ">
          <input
            required
            placeholder="Heading"
            className="input-field text-blue-900 bg-gray-100 border-blue-500 rounded-lg hover:border-blue-600"
            value={formData.heading}
            onChange={(e) =>
              setFormData({ ...formData, heading: e.target.value })
            }
          />
  
          <input
            placeholder="Sub Heading"
            className="input-field text-blue-900 bg-gray-100 border-blue-500 rounded-lg hover:border-blue-600"
            value={formData.sub_heading}
            onChange={(e) =>
              setFormData({ ...formData, sub_heading: e.target.value })
            }
          />
        </div>
  
        <textarea
          placeholder="Description"
          rows={3}
          className="input-field text-blue-900 bg-gray-100 rounded-lg w-full"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
  
        <input
          required
          placeholder="YouTube Link"
          className="input-field text-blue-900 bg-gray-100 w-full rounded-lg border-blue-500 hover:border-blue-600"
          value={formData.youtube_link}
          onChange={(e) =>
            setFormData({ ...formData, youtube_link: e.target.value })
          }
        />
  
        {/* DROPDOWNS */}
        <div className="grid grid-cols-2 gap-4">
          <select
            className="input-field text-gray-900"
            value={formData.video_type}
            onChange={(e) =>
              setFormData({ ...formData, video_type: e.target.value })
            }
          >
            <option value="sermon">Sermon</option>
            <option value="song">Song</option>
            <option value="other">Other</option>
          </select>
  
          <select
            className="input-field text-gray-900"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
  
      {/* RIGHT SIDE – VIDEO PREVIEW */}
      <div className="bg-gray-100 rounded-lg p-4 shadow-inner h-fit">
  
        <p className="font-semibold text-gray-900 mb-2">Preview</p>
  
        {/* Only show preview when link typed */}
        {formData.youtube_link ? (
          <div className="aspect-video rounded overflow-hidden border">
            <iframe
              src={
                formData.youtube_link.includes("watch?v=")
                  ? `https://www.youtube.com/embed/${
                      formData.youtube_link.split("v=")[1].split("&")[0]
                    }`
                  : formData.youtube_link.includes("youtu.be/")
                  ? `https://www.youtube.com/embed/${
                      formData.youtube_link.split("youtu.be/")[1]
                    }`
                  : ""
              }
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="aspect-video rounded bg-gray-300 flex items-center justify-center text-gray-600">
            <span>No Video Preview</span>
          </div>
        )}
      </div>
    </div>
  
    {/* SUBMIT BUTTON */}
    <button
      disabled={isSubmitting}
      className="btn-primary bg-red-600 hover:bg-red-700 w-full mt-6 text-white font-semibold py-2 rounded-lg"
    >
      {isSubmitting ? (
        <Loader2 className="animate-spin mx-auto" />
      ) : editingId ? (
        "Update Video"
      ) : (
        "Publish Video"
      )}
    </button>
  </form>
  
  
         {/* LIST */}
  <div className="space-y-6">
    {Object.keys(groupedVideos).map(type => (
      <div key={type} className="bg-white p-6 rounded-xl shadow-md">
        
        <h3 className="text-lg font-bold text-gray-900 capitalize border-b pb-2 mb-4">
          {type}s
        </h3>
  
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedVideos[type].map(video => (
            <div 
              key={video.id} 
              className="bg-gray-100 rounded-xl shadow-sm overflow-hidden border border-gray-300"
            >
              
              {/* YOUTUBE PLAYER */}
              <div className="aspect-video">
                <iframe
                  src={video.embed_code}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
  
              {/* VIDEO TEXT CONTENT */}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-gray-900">{video.heading}</h4>
                <p className="text-sm text-gray-700">{video.sub_heading}</p>
                <p className="text-xs text-gray-600">{video.description}</p>
  
                <span className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${video.category === 'public' 
                    ? 'bg-green-200 text-green-900' 
                    : 'bg-yellow-200 text-yellow-900'
                  }`}>
                  {video.category}
                </span>
              </div>
  
              {/* ACTION BUTTONS */}
              <div className="p-3 border-t flex justify-between">
                <button 
                  onClick={() => handleEdit(video)} 
                  className="text-blue-700 font-semibold hover:text-blue-900 hover:underline"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(video.id)} 
                  className="text-red-700 font-semibold hover:text-red-900 hover:underline"
                >
                  Delete
                </button>
              </div>
  
            </div>
          ))}
        </div>
      </div>
    ))}
  
    {videos.length === 0 && !isLoading && (
      <p className="text-center text-gray-600">No videos found.</p>
    )}
    </div>
  
        </div>
        </AuthGuard>
      );
    };
  