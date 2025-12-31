"use client";
import { useEffect, useState } from 'react';
import { Search, Loader2, BookOpen, Video, Filter, Scroll, PlayCircle } from 'lucide-react'; 
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import VideoCard from '@/components/VideoCard';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';

export default function BlogHub() {
  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'videos'
  
  // Data State
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState(['All']);
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setUserUid(user ? user.uid : 'guest');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userUid) return;

    async function fetchData() {
      setLoading(true);
      try {
        const endpoint = activeTab === 'articles' 
            ? `/api/public/blogs?search=${search}&type=${selectedType}&requester=${userUid}`
            : `/api/public/videos?search=${search}&type=${selectedType}&requester=${userUid}`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setItems(data.data || []);
          setTypes(['All', ...(data.types || [])]);
        } else {
          setItems([]);
        }
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, selectedType, activeTab, userUid]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans ">
      <Navbar />
      
      {/* --- HERO SECTION (From Sample) --- */}
      <section className="relative overflow-hidden mb-8">
          <div className="relative h-[95vh] flex items-center justify-center bg-gray-900 overflow-hidden">
            
            {/* Animated Blur Gradient Background */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 right-1/8 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-1/4 left-1/10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>
            
            <motion.div 
                key={activeTab} // Re-animate on tab switch
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center px-4 max-w-4xl"
            >
                <div className="mb-6 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-full shadow-2xl">
                        {activeTab === 'articles' ? <Scroll size={40} className="text-blue-300" /> : <PlayCircle size={40} className="text-red-400" />}
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
                    {activeTab === 'articles' ? 'Read & Reflect' : 'Watch & Worship'}
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                    {activeTab === 'articles' 
                        ? "Dive into spiritual insights,news and stories of faith." 
                        : "Experience our latest sermons, songs and messages."}
                </p>

                {/* Tab Switcher in Hero */}
                <div className="inline-flex bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-xl">
                    <button 
                        onClick={() => { setActiveTab('articles'); setSelectedType('All'); }}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'articles' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                    >
                        <BookOpen size={18}/> Articles
                    </button>
                    <button 
                        onClick={() => { setActiveTab('videos'); setSelectedType('All'); }}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'videos' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                    >
                        <Video size={18}/> Videos
                    </button>
                </div>

            </motion.div>
          </div>
      </section>

      {/* --- STICKY SEARCH BAR --- */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-4 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full lg:w-96 flex-shrink-0 group">
                <input 
                    type="text" 
                    placeholder={`Search ${activeTab}...`} 
                    className="w-full bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-600 text-slate-900 pl-11 pr-4 py-2.5 rounded-full outline-none transition-all text-sm font-medium shadow-inner focus:shadow-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-4 top-3 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              </div>

              {/* Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center w-full lg:w-auto">
                <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider mr-2">
                    <Filter size={14} className="mr-1" /> Filters
                </div>
                {types.map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                            ${selectedType === type 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' 
                            : 'bg-white text-slate-600 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'}
                        `}
                    >
                        {type}
                    </button>
                ))}
              </div>
          </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto px-4 mt-12 pb-18">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
             <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4"/>
             <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Loading {activeTab}...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.map((item) => (
                        activeTab === 'articles' 
                            ? <BlogCard key={item.id} blog={item} />
                            : <VideoCard key={item.id} video={item} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm border border-gray-100">
                        {activeTab === 'articles' ? <BookOpen size={40}/> : <Video size={40}/>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No results found</h3>
                    <p className="text-gray-500 text-sm mb-6">We couldn&apos;t find any {activeTab} matching your search.</p>
                    <button 
                        onClick={() => {setSearch(''); setSelectedType('All')}} 
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                        Clear filters & show all
                    </button>
                </div>
            )}
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}