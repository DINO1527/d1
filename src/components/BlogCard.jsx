"use client";
import { BookOpen, User, Calendar, Lock } from 'lucide-react';

export default function BlogCard({ blog }) {
  if (!blog) return null;

  return (
    <a href={`/blogs/${blog.id}`} className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-xl shadow-sm">
      {/* Cover Image */}
      <div className="aspect-video w-full bg-gray-100 relative overflow-hidden">
        {blog.photo_url ? (
          <img 
            src={blog.photo_url} 
            alt={blog.heading} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <BookOpen size={48} />
            <span className="text-xs mt-2 uppercase tracking-widest font-semibold">Read Article</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-1">
            {blog.category === 'private' && (
                <div className="bg-amber-100 text-amber-700 p-1 rounded-md border border-amber-200" title="Members Only">
                    <Lock size={12} />
                </div>
            )}
            <div className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-gray-200 shadow-sm">
                {blog.blog_type}
            </div>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-slate-900 font-bold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {blog.heading}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow font-medium leading-relaxed">
          {blog.sub_heading}
        </p>

        {/* Author Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <img 
            src={blog.author_photo || `https://ui-avatars.com/api/?name=${blog.author_name}&background=random`} 
            className="w-8 h-8 rounded-full bg-gray-200 object-cover border border-gray-200"
            alt=""
          />
          <div className="flex flex-col">
             <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{blog.author_name || "Admin"}</span>
             <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                <Calendar size={10}/>
                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
             </div>
          </div>
        </div>
      </div>
    </a>
  );
}