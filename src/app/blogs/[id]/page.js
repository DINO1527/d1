"use client";
import { useEffect, useState, use } from 'react';
import { Loader2, ArrowLeft, Share2, Calendar, ThumbsUp, Link as LinkIcon, ExternalLink, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { auth } from '@/lib/firebase';

export default function BlogReadPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);

  // 1. Auth & Fetch
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setUid(user ? user.uid : 'guest');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(!uid) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/blogs/${id}?requester=${uid}`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, uid]);

  if (loading) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-900 w-10 h-10"/></div>;
  if (!data || !data.blog) return <div className="h-screen bg-white text-gray-800 flex items-center justify-center">Article not found or access denied.</div>;

  const { blog, related } = data;

  return (
    <div className="min-h-screen bg-[#fff] text-slate-900 font-sans pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="relative w-full h-[400px] bg-slate-900">
         {blog.photo_url && (
            <img src={blog.photo_url} className="w-full h-full object-cover opacity-60" alt={blog.heading} />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto text-white">
            <Link href="/blogs" className="inline-flex items-center text-white/70 hover:text-white mb-4 transition text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16} className="mr-2"/> Back to Hub
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">{blog.heading}</h1>
            <p className="text-lg text-gray-300 font-light leading-relaxed">{blog.sub_heading}</p>
         </div>
      </div>

      {/* Article Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* === MAIN CONTENT (Left) === */}
        <div className="lg:col-span-8">
           
           {/* Meta Bar */}
           <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
              <div className="flex items-center gap-3">
                 <img src={blog.author_photo || "https://ui-avatars.com/api/?background=random"} className="w-10 h-10 rounded-full border border-gray-200"/>
                 <div>
                    <p className="text-sm font-bold text-gray-900">{blog.author_name}</p>
                    <p className="text-xs text-gray-500">{new Date(blog.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"><Share2 size={18}/></button>
              </div>
           </div>

           {/* Rich Text Content - Fixed Error Here */}
           <div className="prose prose-lg prose-slate max-w-none prose-img:rounded-xl">
              {blog.content ? blog.content.split('\n').map((paragraph, idx) => (
                 <p key={idx} className="mb-6 leading-8 text-gray-700">{paragraph}</p>
              )) : <p>No content available.</p>}
           </div>

           {/* External Link Button */}
           {blog.external_link && (
             <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-600 mb-4 font-medium">Interested in learning more about this topic?</p>
                <a href={blog.external_link} target="_blank" className="inline-flex items-center px-6 py-3 bg-blue-900 text-white font-bold rounded-full hover:bg-blue-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Visit External Resource
                </a>
             </div>
           )}
        </div>

        {/* === SIDEBAR (Right) === */}
        <div className="lg:col-span-4 space-y-10">
           
           {/* Related Posts */}
           <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-3">More Like This</h3>
              <div className="flex flex-col gap-6">
                {related && related.map((item) => (
                    <Link href={`/blogs/${item.id}`} key={item.id} className="group flex gap-4 items-start">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.photo_url && <img src={item.photo_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-500"/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1">
                                {item.heading}
                            </h4>
                            <p className="text-xs text-gray-500 mb-2">{new Date(item.created_at).toLocaleDateString()}</p>
                            <span className="text-xs font-bold text-blue-600 group-hover:underline">Read Article</span>
                        </div>
                    </Link>
                ))}
                {(!related || related.length === 0) && <p className="text-gray-500 text-sm">No related posts.</p>}
              </div>
           </div>

           {/* Newsletter / CTA */}
           <div className="bg-blue-900 rounded-2xl p-8 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><BookOpen size={100}/></div>
              <h3 className="text-2xl font-bold mb-2 relative z-10">Join Our Community</h3>
              <p className="text-blue-100 mb-6 relative z-10">Get the latest sermons and church news delivered directly to you.</p>
              <button className="w-full py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-gray-100 transition relative z-10">
                 Subscribe
              </button>
           </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}