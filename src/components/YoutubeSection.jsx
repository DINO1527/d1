"use client";
import { useEffect, useState, useRef } from 'react';
import { Youtube, PlayCircle, Loader2, ArrowRight, Lock, ExternalLink } from 'lucide-react';

export default function YoutubeSection() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch Videos
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/public/videos/home?limit=10');
        if (res.ok) {
          const data = await res.json();
          setVideos(data.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch videos", e);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  // --- THUMBNAIL & ID LOGIC ---
  const getYoutubeDetails = (link) => {
    if (!link) return { id: null, thumbnail: null };
    let id = null;
    let thumbnail = null;

    if (link.includes('v=')) {
      id = link.split('v=')[1].split('&')[0];
    } else if (link.includes('youtu.be/')) {
      id = link.split('youtu.be/')[1];
    }

    if (id) {
      thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }

    return { id, thumbnail };
  };

  // --- DATA DUPLICATION (Infinite Loop Buffer) ---
  // Duplicate enough times to allow smooth scrolling before reset
  const extendedVideos = videos.length > 0 ? [...videos, ...videos, ...videos, ...videos, ...videos, ...videos] : [];

  // --- AUTO SCROLL & CENTER DETECTION ---
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || loading || extendedVideos.length === 0) return;

    let animationFrameId;

    const animate = () => {
      if (!isPaused) {
        // Continuous scroll
        scrollContainer.scrollLeft += 0.8;
        
        // Infinite Loop Reset:
        // When we scroll past half the total width (the midpoint of duplications),
        // we subtract that half-width. This smoothly teleports us back to a matching position
        // in the first half of the list without a visible jump.
        const halfWidth = scrollContainer.scrollWidth / 2;
        if (scrollContainer.scrollLeft >= halfWidth) {
           scrollContainer.scrollLeft -= halfWidth;
        }
      }
      
      // --- ROBUST CENTER INDEX CALCULATION ---
      const containerCenter = scrollContainer.scrollLeft + (scrollContainer.clientWidth / 2);
      
      // Determine widths based on device (approximate for calculation)
      // Mobile Card: 80vw (~300-350px) | Overlap: -ml-4 (~16px)
      // Desktop Card: 400px | Overlap: -ml-12 (~48px)
      const isMobile = window.innerWidth < 768;
      const baseWidth = isMobile ? window.innerWidth * 0.80 : 400; 
      const overlap = isMobile ? 16 : 48; 
      
      // The "Effective Width" is the distance from one card's start to the next card's start
      const effectiveCardWidth = baseWidth - overlap;
      
      // Calculate index relative to the center
      // We subtract half the base width to align the calculation with the center of the card
      const index = Math.floor((containerCenter - (baseWidth / 2)) / effectiveCardWidth);
      
      // Ensure index is positive
      setActiveIndex(index < 0 ? 0 : index);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [loading, extendedVideos, isPaused]);


  return (
    <section className="relative py-12 md:py-24 bg-white overflow-hidden min-h-[600px] flex items-center">
      
      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 items-center">
          
          {/* --- LEFT SIDE: TEXT CONTENT --- */}
          <div className="lg:col-span-4 flex flex-col items-start text-left z-20 w-full relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-1 bg-blue-900"></span>
              <span className="text-blue-900  tracking-widest uppercase text-xs md:text-sm">
                Our Media Library
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl  font-bold text-black tracking-tight leading-[1.1] mb-6">
              Watch <br />
              <span className="text-blue-900">
                Latest Updates
              </span>
            </h2>
            
            <p className="text-gray-600 text-base md:text-lg mb-8 leading-relaxed max-w-md">
              Dive into our latest worship sessions and community stories. 
              Find the message you need today.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <a
                href="https://www.youtube.com/@TheGraceEvangelicalChurch"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-blue-900 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-blue-900/20 transition-all hover:bg-black hover:scale-105"
              >
                <Youtube className="text-red-500" size={20} />
                <span>Visit Channel</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>

          {/* --- RIGHT SIDE: VIDEO CONTAINER --- */}
          {/* Separate Container for Mobile Responsiveness */}
          <div className="w-full lg:col-span-8 relative mt-4 lg:mt-0">
            {loading ? (
              <div className="flex justify-center items-center h-60 w-full bg-gray-50 rounded-3xl">
                <Loader2 className="animate-spin text-blue-900 w-10 h-10" />
              </div>
            ) : (
              // Mobile Breakout Container: -mx-4 to ignore parent padding on mobile
              <div 
                className="relative w-[calc(100%+2rem)] -mx-4 md:w-full md:mx-0"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
              >
                <div 
                  ref={scrollRef}
                  className="flex overflow-x-auto py-12 px-[10vw] md:px-4 hide-scrollbar scroll-smooth items-center snap-x snap-mandatory"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    cursor: 'grab'
                  }}
                >
                  {extendedVideos.map((video, idx) => {
                    const isActive = idx === activeIndex;
                    const { id, thumbnail } = getYoutubeDetails(video.youtube_link);
                    
                    // Z-Index: Center item on top
                    const zIndex = 100 - Math.abs(idx - activeIndex);

                    return (
                      <div 
                        key={`${video.id}-${idx}`}
                        className={`
                          relative flex-shrink-0 snap-center
                          transition-all duration-500 ease-out
                          ${idx !== 0 ? '-ml-4 md:-ml-12' : ''} // Reduced overlap on mobile (-ml-4)
                        `}
                        style={{
                          // Mobile: 80vw width | Desktop: 400px width
                          width: "var(--card-width)",
                          zIndex: zIndex,
                          transform: isActive ? "scale(1.1)" : "scale(0.9)",
                          opacity: 1, 
                          '--card-width': typeof window !== 'undefined' && window.innerWidth < 768 ? '80vw' : '400px'
                        }}
                      >
                         <VideoCard 
                           video={video} 
                           id={id} 
                           thumbnail={thumbnail} 
                           isActive={isActive} 
                         />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- CARD COMPONENT ---
function VideoCard({ video, id, thumbnail, isActive }) {
  
  return (
    <div className={`
      group flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden 
      border border-[#333] shadow-2xl transition-all duration-300
      ${isActive ? 'border-red-900/50 ring-1 ring-red-900/30' : 'hover:bg-[#2a2a2a]'}
    `}
    style={{ height: isActive ? '100%' : '100%' }} // Fill container
    >
      
      {/* Media Area (Thumbnail) */}
      <div className="relative aspect-video w-full bg-black block overflow-hidden">
         <a href={video.youtube_link} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
           {thumbnail ? (
             <img 
               src='youtube.png ' 
               alt={video.heading}
               className={`
                  w-full h-full object-cover transition-all duration-500
                  ${isActive ? 'opacity-100' : 'opacity-60 grayscale group-hover:grayscale-0'}
               `} 
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-700">
               <Youtube size={48} />
             </div>
           )}
               </a>

              {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-1 pointer-events-none">
            {video.category === 'private' && (
                <div className="bg-amber-500/90 text-black p-1 rounded-md shadow-md">
                    <Lock size={12} />
                </div>
            )}
            {video.video_type && (
                <div className="bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-white/10">
                    {video.video_type}
                </div>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow relative bg-[#1e1e1e]">
        {/* Dark overlay for inactive cards to push them back visually */}
        {!isActive && <div className="absolute inset-0 bg-black/60 z-10"></div>}

        <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-red-500 transition-colors">
              <a href={video.youtube_link} target="_blank" rel="noopener noreferrer">
                {video.heading}
              </a>
            </h3>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-3 font-light">
          {video.description || video.sub_heading || "Watch our latest sermon."}
        </p>
        
        <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-gray-500">
                {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Recent'}
            </span>
            <a href={video.youtube_link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline">
                Watch on YouTube <ExternalLink size={10}/>
            </a>
        </div>
      </div>
    </div>
  );
}