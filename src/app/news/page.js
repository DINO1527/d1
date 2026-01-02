"use client";
import React, { useEffect, useState } from 'react';
import { 
    Loader2, AlertTriangle, X, Calendar as CalendarIcon, Download, User, Sparkles, MapPin, 
    Bell, ArrowRight, Table as TableIcon, Cake, Heart, ChevronLeft, ChevronRight, Menu, Clock, CalendarDays 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import AuthGuard from '@/components/AuthGuard';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ==================================================================================
// 2. SUB-COMPONENTS
// ==================================================================================

// --- UPCOMING EVENTS LIST (Agenda View) ---
// UPDATED: Removed max-height and scrolling. Now expands fully.
const UpcomingEvents = ({ specialDates, serverDate }) => {
    const today = new Date(serverDate || new Date());
    
    // Filter events for the next 30 days
    const upcomingEvents = specialDates ? specialDates.filter(evt => {
        const d = new Date(evt.event_date);
        const todayZero = new Date(today);
        todayZero.setHours(0,0,0,0);
        const nextMonth = new Date(today);
        nextMonth.setDate(today.getDate() + 30);
        return d >= todayZero && d <= nextMonth;
    }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)) : [];

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-amber-500 p-5 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-wider"><CalendarDays size={20} /> Celebrations</h3>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-md">Upcoming</span>
            </div>

            <div className="p-4">
                {upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingEvents.map((evt, idx) => {
                            const isBday = evt.event_type.toLowerCase().includes('birthday');
                            const d = new Date(evt.event_date);
                            const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth();

                            return (
                                <div key={idx} className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors ${isToday ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 border ${isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">{d.toLocaleString('default', {month:'short'})}</span>
                                        <span className="text-lg font-black leading-none">{d.getDate()}</span>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 w-fit ${isBday ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {isBday ? <Cake size={10} className="mb-0.5"/> : <Heart size={10} className="mb-0.5"/>}
                                                {evt.event_type}
                                            </span>
                                            {isToday && <span className="text-[10px] font-bold text-blue-600 animate-pulse">TODAY</span>}
                                        </div>
                                        <p className="font-bold text-slate-800 text-sm truncate" title={evt.person_name}>{evt.person_name}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400 space-y-2">
                        <CalendarIcon size={32} className="opacity-20"/>
                        <p className="text-sm italic">No upcoming celebrations.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ROSTER CARD ---
const RosterCard = ({ rosterDisplayData, text, rosterDateLabel, onOpenFull }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden group flex flex-col">
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
            <div className="relative z-10">
                <h3 className="font-bold text-lg flex gap-2 items-center"><User size={20} className="text-blue-400"/> {text.roster}</h3>
                <p className="text-blue-200 text-xs mt-0.5 font-medium">Sunday, {rosterDateLabel}</p>
            </div>
        </div>
        
        <div className="p-2 divide-y divide-gray-50 flex-grow">
            {rosterDisplayData.slice(0, 5).map((r, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3 truncate pr-2">{r.role}</span>
                    <div className="text-right w-2/3">
                        <p className="text-sm font-bold text-slate-800 truncate">{r.main.join(', ')}</p>
                        {r.alt.length > 0 && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Alt: {r.alt.join(', ')}</p>}
                    </div>
                </div>
            ))}
        </div>
        
        <button 
            onClick={onOpenFull} 
            className="w-full py-4 bg-slate-50 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-t border-gray-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest mt-auto"
        >
            {text.fullSchedule} <ArrowRight size={14}/>
        </button>
    </div>
);

// ==================================================================================
// 3. LOGIC & HELPERS
// ==================================================================================

const getWeekNumber = (date) => {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

const processRosterData = (rosterList) => {
  if (!rosterList || rosterList.length === 0) return [];
  const groups = {};
  rosterList.forEach(item => {
    if (!groups[item.role_name]) groups[item.role_name] = { main: [], alt: [] };
    const names = item.assigned_person.split(/[,/]/).map(n => n.trim()).filter(n => n && n !== '0');
    if (item.is_alternative) groups[item.role_name].alt.push(...names);
    else groups[item.role_name].main.push(...names);
  });
  return Object.entries(groups).map(([role, data]) => ({
    role,
    main: [...new Set(data.main)],
    alt: [...new Set(data.alt)]
  }));
};

const UI_TEXT = {
  en: {
    bulletin: "Weekly Bulletin",
    subtitle: "Stay connected with the latest updates, rosters, and celebrations.",
    latestNews: "Latest News",
    roster: "Duty Roster",
    celebrations: "Celebrations",
    sunday: "This Sunday",
    savePdf: "Save as PDF",
    noNews: "No announcements for this week.",
    noRoster: "Roster not generated yet.",
    noBirthdays: "No celebrations this week.",
    fullSchedule: "View Full Schedule",
    verse: "\"Give ear, O Lord, to my prayer; and attend to the voice of my supplications.\"",
    verseRef: "— Psalm 86:6",
    close: "Close",
    role: "Role / Duty",
    assigned: "Assigned",
    altBadge: "Alt",
    generating: "Generating PDF...",
    congLang: "Congregation"
  },
  ta: {
      bulletin: "வாராந்திர செய்தி மடல்",
      subtitle: "சபையின் செய்திகள்...",
      latestNews: "சமீபத்திய செய்திகள்",
      roster: "பணி பட்டியல்",
      celebrations: "கொண்டாட்டங்கள்",
      savePdf: "PDF ஆக சேமி",
      verse: "\"கர்த்தாவே, என் ஜெபத்திற்குச் செவிகொடுத்து...\"",
      verseRef: "— சங்கீதம் 86 : 6",
      generating: "PDF உருவாகிறது...",
      congLang: "Congregation"
  },
  si: {
      bulletin: "සතිපතා බුලටින්",
      subtitle: "නවතම යාවත්කාලීන කිරීම්...",
      latestNews: "නවතම පුවත්",
      roster: "රාජකාරි ලැයිස්තුව",
      celebrations: "සැමරුම්",
      savePdf: "PDF ලෙස සුරකින්න",
      verse: "\"ස්වාමීනි, මාගේ යාච්ඤාවට කන් දුන මැනව...\"",
      verseRef: "— ගීතාවලිය 86:6",
      generating: "PDF සකසමින්...",
      congLang: "Congregation"
  }
};

// ==================================================================================
// 4. MAIN PARENT COMPONENT
// ==================================================================================

export default function MainNews() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null);
  const [lang, setLang] = useState('en');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setUserUid(user ? user.uid : 'guest');
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!userUid) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/news-feed?requester=${userUid}`);
        if (res.ok) {
          const jsonData = await res.json();
          setData(jsonData);
          if (jsonData.userLanguage === 'Tamil') setLang('ta');
          else if (jsonData.userLanguage === 'Sinhala') setLang('si');
          else setLang('en');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load news.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userUid]);

  // 3. PDF Handler
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
        const response = await fetch(`/api/public/generate-pdf?requester=${userUid}`);
        if (!response.ok) throw new Error("PDF generation failed");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weekly_Bulletin_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("PDF Error:", error);
        setErrorMsg("Failed to generate PDF. Please try again.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-100"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

  const text = UI_TEXT[lang];
  const rosterDisplayData = data ? processRosterData(data.roster) : [];
  const showRoster = data && data.roster && data.roster.length > 0;
  
  const rosterDateLabel = data?.sundayDate ? (() => {
    const d = new Date(data.sundayDate);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  })() : "";

  return (
    <AuthGuard allowedRoles={['admin', 'creator', 'editor', 'member']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        
        {/* Error Banner */}
        <AnimatePresence>
            {errorMsg && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-50 border-b border-red-200 fixed top-16 w-full z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-red-700 text-sm">
                <div className="flex gap-2"><AlertTriangle size={18} /><span>{errorMsg}</span></div>
                <button onClick={() => setErrorMsg(null)}><X size={18}/></button>
                </div>
            </motion.div>
            )}
        </AnimatePresence>

        <Navbar />

        {/* ROSTER MODAL (Full View) */}
        <AnimatePresence>
            {isRosterOpen && showRoster && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsRosterOpen(false)}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-blue-900 text-white p-6 flex justify-between items-center shadow-md z-10">
                    <div>
                        <h2 className="text-2xl font-bold flex gap-3 items-center"><TableIcon className="text-blue-300"/> {text.roster}</h2>
                        <p className="text-blue-200 text-sm mt-1">For Sunday, {rosterDateLabel}</p>
                    </div>
                    <button onClick={() => setIsRosterOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"><X size={20}/></button>
                </div>
                <div className="overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-300">
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold sticky top-0 z-10 border-b">
                        <tr><th className="px-6 py-4 w-1/3 tracking-wider">{text.role}</th><th className="px-6 py-4 tracking-wider">{text.assigned}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {rosterDisplayData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700 bg-gray-50/50 align-top">{item.role}</td>
                            <td className="px-6 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                                {item.main.map((n, i) => <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold shadow-sm">{n}</span>)}
                                {item.alt.map((n, i) => <span key={i} className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-semibold border border-amber-200">{n} <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded ml-1 uppercase font-bold">{text.altBadge}</span></span>)}
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>

        {/* HERO SECTION */}
        <div className="relative bg-[#0f172a] text-white pt-36 pb-32 px-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 text-blue-300 font-medium">
                        <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs uppercase tracking-wider flex items-center gap-1.5 border border-white/10 shadow-inner">
                            <MapPin size={12} /> Sri Lanka
                        </span>
                        <span className="text-xs uppercase tracking-widest opacity-60 font-semibold">Week {getWeekNumber(new Date())}</span>
                    </motion.div>
                    
                    <motion.h1 key={lang} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                        {text.bulletin}
                    </motion.h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed">{text.subtitle}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{text.congLang}</span>
                <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg backdrop-blur-md flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    {data?.userLanguage || 'English'}
                </div>
                </div>
            </div>
        </div>

        {/* BIBLE VERSE */}
        <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-center text-center gap-6 border border-gray-100">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 shadow-sm rotate-3"><Sparkles size={28} /></div>
            <div>
                <motion.p key={lang} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl md:text-2xl font-serif text-slate-800 leading-relaxed italic">
                    {text.verse}
                </motion.p>
                <p className="text-sm font-bold text-slate-400 mt-3 uppercase tracking-widest">{text.verseRef}</p>
            </div>
            </motion.div>
        </div>

        {/* MAIN CONTENT AREA: 2 Columns */}
        {/* UPDATED: Reduced bottom padding to pb-12 */}
        <div className="max-w-7xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT COLUMN: NEWS FEED (Main Content) */}
            <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <Bell className="text-blue-600 fill-blue-600" size={28} /> {text.latestNews}
                    </h2>
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="inline-flex items-center px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {isGeneratingPdf ? <Loader2 size={16} className="animate-spin mr-2"/> : <Download size={16} className="mr-2"/>} 
                        {isGeneratingPdf ? text.generating : text.savePdf}
                    </button>
                </div>

                <div className="space-y-6">
                    {data?.news?.length > 0 ? data.news.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md">
                        {/* Header Row: Date Badge + Title */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-100 shrink-0 self-start">
                                <span className="text-2xl font-black leading-none">{new Date(item.date).getDate()}</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider">{new Date(item.date).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-slate-900 leading-snug">{item.title}</h3>
                                {item.lang && (
                                    <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-slate-200">
                                        {item.lang}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Content - Full Width */}
                        <ul className="space-y-3 pl-1 border-l-2 border-slate-100 ml-2">
                            {item.items.map((desc, i) => (
                                <li key={i} className="text-slate-600 font-medium flex items-start gap-3 leading-relaxed text-sm sm:text-base pl-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                                    <span>{desc}</span>
                                </li>
                            ))}
                        </ul>
                    </div> 
                    )) : (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 text-slate-400 font-medium">
                        {text.noNews}
                    </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR (Roster then Calendar) */}
            <div className="lg:col-span-5 space-y-8 order-1 lg:order-2">
                
                {/* 1. ROSTER (Placed First) */}
                {showRoster && (
                    <RosterCard 
                        rosterDisplayData={rosterDisplayData} 
                        text={text} 
                        rosterDateLabel={rosterDateLabel} 
                        onOpenFull={() => setIsRosterOpen(true)} 
                    />
                )}

                {/* 2. UPCOMING CELEBRATIONS (Placed Second) */}
                {data?.specialDates && (
                    <UpcomingEvents specialDates={data.specialDates} serverDate={data.serverDate} />
                )}

            </div>

        </div>
        <Footer />
      </div>
    </AuthGuard>
  );
}