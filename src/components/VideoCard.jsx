"use client";
import { PlayCircle, Lock, ExternalLink, Youtube } from 'lucide-react';

export default function VideoCard({ video }) {
  if (!video) return null;

  // Extract Thumbnail from YouTube Link if possible
  let thumbnail = null;
  if(video.youtube_link) {if(video.youtube_link.includes('v=')) thumbnail = `https://img.youtube.com/vi/${video.youtube_link.split('v=')[1].split('&')[0]}/hqdefault.jpg`;
     else if(video.youtube_link.includes('youtu.be/')) thumbnail = `https://img.youtube.com/vi/${video.youtube_link.split('youtu.be/')[1]}/hqdefault.jpg`;

       }

  return (
    <div className="group flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden hover:bg-[#2a2a2a] transition-all duration-300 border border-[#333] hover:border-red-900/50 hover:shadow-lg">
      
      {/* Thumbnail Area */}
      <a href={video.youtube_link} target="_blank" rel="noopener noreferrer" className="relative aspect-video w-full bg-black block overflow-hidden">
        {thumbnail ? (
            <img src={thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700">
                <Youtube size={48} />
            </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <PlayCircle size={24} className="text" />
            </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-1">
            {video.category === 'private' && (
                <div className="bg-amber-500/90 text-black p-1 rounded-md" title="Members Only">
                    <Lock size={12} />
                </div>
            )}
            <div className="bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-white/10">
                {video.video_type}
            </div>
        </div>
      </a>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-red-500 transition-colors">
            <a href={video.youtube_link} target="_blank" rel="noopener noreferrer">{video.heading}</a>
            </h3>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-3 font-light">
          {video.description || video.sub_heading}
        </p>
        
        <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-gray-500">
                {new Date(video.created_at).toLocaleDateString()}
            </span>
            <a href={video.youtube_link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline">
                Watch on YouTube <ExternalLink size={10}/>
            </a>
        </div>
      </div>
    </div>
  );
}