"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import UserManager from '@/components/admin/UserManager';
import NewsManager from '@/components/admin/NewsManager';
import BookManager from '@/components/admin/BookManager';
import BlogManager from '@/components/admin/BlogManager';
import VideoManager from '@/components/admin/VideoManager';
import RosterManager from '@/components/admin/RosterManager';
import SpecialDatesManager from '@/components/admin/SpecialDatesManager';
import ActivityManager from '@/components/admin/ActivityManager';
import { supabase } from '@/lib/supabase';

import { 
  ShieldCheck, Video, FileText, Calendar, Users, Book,
  LogOut, Loader2, Upload, ArrowLeft, Save, Trash2, Edit2,Activity, XCircle, ExternalLink 
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userInfo } from 'os';

// --- HELPER: Group Data by Language ---
const groupByLanguage = (data, key) => {
  return data.reduce((acc, item) => {
    const language = item[key] || 'Uncategorized';
    if (!acc[language]) acc[language] = [];
    acc[language].push(item);
    return acc;
  }, {});
};

export default function AdminDashboard() {
  const router = useRouter();
  
  // Auth State
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard'); 

  // --- SECURITY CHECK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'admin' || storedRole === 'editor'||storedRole === 'creator') {
          setUser(currentUser);
          setRole(storedRole);
          setLoading(false);
        } else {
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  // --- FILE UPLOAD (Supabase) ---
  const handleFileUpload = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ==========================================
  {/* 3. VIDEO MANAGER */}
  // ==========================================
    <VideoManager />

  // ==========================================
  {/*BLOG MANAGER   */}
  // ==========================================
   
   <BlogManager />

  // ==========================================
   {/*BOOK MANAGER */}
  // ==========================================
  
    <BookManager />

  // ==========================================
 {/* 4. NEWS MANAGER */}
  // ==========================================

    <NewsManager />

  // ==========================================
  {/* 5. SPECIAL DATES MANAGER*/}
  // ==========================================
    
    <SpecialDatesManager />

    // ==========================================
  {/* 6. ROSTERS MANAGER*/}
    // ==========================================
    <RosterManager />
  // ==========================================
  {/* 7. USER MANAGER (Admin Only)*/}
  // ==========================================

   <UserManager />

   // ==========================================
  {/* 8. DASHBOARD */}  
  // ==========================================

  <ActivityManager />

  // --- RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-900 w-10 h-10"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <style jsx global>{`
        .input-field { @apply border border-gray-500 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 w-full transition; }
        .btn-primary { @apply text-white font-bold py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition shadow-sm; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 pt-24">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div className="flex items-center gap-4 w-full md:w-auto">
             {activeTab !== 'dashboard' ? (
                <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-blue-500 rounded-full shadow hover:bg-gray-500"><ArrowLeft size={24}/></button>
             ) : <ShieldCheck size={40} className="text-blue-900"/>}
             
             <div>
               <h1 className="text-2xl font-bold text-gray-900">{activeTab === 'dashboard' ? 'Admin Dashboard' : activeTab.toUpperCase()}</h1>
               <p className="text-sm text-gray-500">Role:<span></span> <span className="font-semibold uppercase text-blue-600">{role}</span></p>
             </div>
           </div>
        </div>

        {/* CONTENT */}
        {activeTab === 'dashboard' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            
              {['admin', 'editor', 'creator'].includes(role) && <DashboardCard icon={<FileText size={32}/>} color="text-blue-600" border="border-blue-500" title="Blogs" desc="Sermons & Articles" onClick={() => setActiveTab('blogs')} />}
              {['admin', 'editor'].includes(role) && <DashboardCard icon={<Video size={32}/>} color="text-red-600" border="border-red-500" title="Videos" desc="Sermons & Songs" onClick={() => setActiveTab('videos')} />}  
              {['admin', 'editor'].includes(role) && <DashboardCard icon={<Book size={32}/>} color="text-amber-600" border="border-amber-500" title="Books" desc="Library Ministry" onClick={() => setActiveTab('books')} />}
              {['admin', 'editor'].includes(role) && <DashboardCard icon={<Calendar size={32}/>} color="text-green-600" border="border-green-500" title="News" desc="prayer points PDF" onClick={() => setActiveTab('news')} />}
              {['admin', 'editor'].includes(role) && <DashboardCard  icon={<Calendar size={32}/>} color="text-indigo-600" border="border-indigo-500" title="Duty Roster" desc="Manage Weekly Services" onClick={() => setActiveTab('duty_roster')} />}
              {['admin', 'editor'].includes(role) && <DashboardCard icon={<Calendar size={32}/>} color="text-yellow-600" border="border-yellow-500" title="Dates" desc="Birthdays/Events" onClick={() => setActiveTab('dates')} />}
              {['admin', 'editor'].includes(role) && <DashboardCard icon={<Users size={32}/>} color="text-purple-600" border="border-purple-500" title="Users" desc="Manage Access" onClick={() => setActiveTab('users')} />}
              {['admin'].includes(role) && <DashboardCard icon={<Activity size={32}/>} color="text-red-600" border="border-red-500" title="Activity Logs" desc="Manage Access" onClick={() => setActiveTab('activity_logs')} />}

           </div>
        ) : (
           <div className="animate-in slide-in-from-bottom-4 duration-300">
             {activeTab === 'videos' && <VideoManager />}
             {activeTab === 'blogs' && <BlogManager />}
             {activeTab === 'books' && <BookManager />}
             {activeTab === 'news' && <NewsManager />}
             {activeTab === 'dates' && <SpecialDatesManager />}
             {activeTab === 'duty_roster' && <RosterManager />}
             {activeTab === 'users' && <UserManager />}
              {activeTab === 'activity_logs' && <ActivityManager />}
           </div>
        )}
      </div>
    </div>
  );
}

// Simple Card Component
const DashboardCard = ({ icon, color, border, title, desc, onClick }) => (
  <div onClick={onClick} className={`bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition border-l-4 ${border} group`}>
    <div className={`${color} mb-3 group-hover:scale-110 transition-transform`}>{icon}</div>
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    <p className="text-gray-500 text-sm">{desc}</p>
  </div>
);