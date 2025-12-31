"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import Firebase

export default function MembersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null); // Store the actual user object
  const [loading, setLoading] = useState(true);

  // --- SECURITY CHECK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is logged in! Allow access.
        setUser(currentUser);
        setLoading(false);
      } else {
        // User is NOT logged in. Kick them out.
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userRole'); // Clean up local backup
    router.push('/login');
  };

  // Prevent flashing content while checking auth
  if (loading) return null; 

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12 ">
        <div className="flex justify-between items-center mb-8 mt-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Member Portal</h1>
            <p className="text-gray-500">Welcome, {user?.email}</p>
          </div>
          
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Main Content: Additional News */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 space-y-6"
          >
            <h2 className="text-xl font-bold text-blue-900 border-b pb-2">Exclusive Member News</h2>
            
            {/* News Item 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Internal</span>
              <h3 className="text-xl font-bold mt-2">Annual Budget Meeting Details</h3>
              <p className="text-gray-400 text-sm mb-4">Posted: Nov 24, 2025</p>
              <p className="text-gray-600">
                This is private content for members only. We will be discussing the financial plans for the upcoming year...
              </p>
            </div>

             {/* News Item 2 */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Volunteers</span>
              <h3 className="text-xl font-bold mt-2">New Roster for Sunday School</h3>
              <p className="text-gray-400 text-sm mb-4">Posted: Nov 20, 2025</p>
              <p className="text-gray-600">
                Please check the attached PDF for the new schedule. We need two more volunteers for the toddlers section...
              </p>
            </div>
          </motion.div>

          {/* 2. Sidebar: Quick Links */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-white p-6 rounded-xl shadow-lg h-fit"
          >
            <h3 className="font-bold text-gray-800 mb-4">Quick Resources</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-blue-600 hover:underline cursor-pointer">
                📄 Download Constitution
              </li>
              <li className="flex items-center text-blue-600 hover:underline cursor-pointer">
                📅 Service Roster
              </li>
              <li className="flex items-center text-blue-600 hover:underline cursor-pointer">
                🎵 Choir Practice Sheets
              </li>
            </ul>
          </motion.div>

        </div>
      </div>
    </div>
  );
}