"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserMenu from './UserMenu';

// --- NAV LINK COMPONENT (Internal Helper) ---
const NavLink = ({ href, children, mobile = false, onClick, className = "" }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (mobile) {
    return (
      <Link 
        href={href} 
        onClick={onClick}
        className={`block px-3 py-3 rounded-lg font-medium transition-all duration-200 
        ${isActive 
          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-2' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
        } ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link 
      href={href} 
      className={`relative px-2 lg:px-3 py-2 rounded-md font-medium text-xs lg:text-sm transition-all duration-300 group whitespace-nowrap
      ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50/50'}`}
    >
      {children}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-300 origin-left
        ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`} 
      />
    </Link>
  );
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [mysqlData, setMysqlData] = useState({
    role: null,
    photoUrl: '', 
    churchName: '',
    fullName: ''
  });

  const router = useRouter();

  // --- AUTH LISTENER ---
  useEffect(() => {
    // Check localStorage first for immediate UI feedback (optional optimization)
    const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (cachedRole) setMysqlData(prev => ({ ...prev, role: cachedRole }));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          // Sync with your DB to get Role/Church info
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoUrl: user.photoURL
            }),
          });

          if (res.ok) {
            const dbData = await res.json();
            setMysqlData({
              role: dbData.role,
              photoUrl: dbData.photoUrl || user.photoURL,
              churchName: dbData.churchName || '',
              fullName: dbData.fullName || user.displayName
            });
            // Update local storage so AuthGuard can see the role instantly next time
            localStorage.setItem('userRole', dbData.role);
          }
        } catch (error) {
          console.error("Failed to sync user data:", error);
        }
      } else {
        // User logged out
        setFirebaseUser(null);
        setMysqlData({ role: null, photoUrl: '', churchName: '', fullName: '' });
        localStorage.removeItem('userRole');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setMysqlData({ role: null, photoUrl: '', churchName: '', fullName: '' });
      localStorage.removeItem('userRole');
      router.push('/login');
      setIsOpen(false);
    } catch (error) {
      console.error("Logout Failed:", error);
    }
  };

  const handleProfileUpdateCallback = async (newName, newChurch) => {
    try {
        const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uid: firebaseUser.uid,
            fullName: newName,
            churchName: newChurch
        }),
        });

        if (!res.ok) throw new Error("Failed to update");

        setMysqlData(prev => ({
        ...prev,
        fullName: newName,
        churchName: newChurch
        }));
    } catch (e) {
        console.error("Profile update error", e);
    }
  };

  const canAccessDashboard = ['admin', 'editor', 'creator'].includes(mysqlData.role);
  const isPublic = !firebaseUser || mysqlData.role === 'public';

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm fixed w-full z-50 top-0 border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16 md:h-20">
          
          {/* LOGO */}
          <div className="flex-shrink-0 flex items-center min-w-0">
            <Link href="/" className="flex items-center space-x-1 lg:space-x-3 group">
              <img
                src="https://thegraceevangelicalchurch.lk/wp-content/uploads/2024/03/church_logo.png"
                alt="Church Logo"
                className="h-10 md:h-12 w-auto transform transition-transform group-hover:scale-105 duration-300 flex-shrink-0"
              />
              <span className="text-sm md:text-base lg:text-xl font-bold text-blue-900 hidden lg:block tracking-tight group-hover:text-blue-700 transition-colors whitespace-nowrap">
                The Grace Evangelical Church
              </span>
            </Link>
          </div>
          
          {/* --- DESKTOP MENU --- */}
          <div className="hidden md:flex items-center space-x-0.5 lg:space-x-2 flex-wrap lg:flex-nowrap">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/ministries">Ministries</NavLink>
            <NavLink href="/about">About</NavLink>              
            <NavLink href="/blogs">Blogs</NavLink>              
            <NavLink href="/books">Books</NavLink>

            
             {/* Protected Link: News */}
            {!isPublic && (
              <NavLink href="/news">News</NavLink>
            
            )}

            {/* Role Based Link: Dashboard */}
            {canAccessDashboard && (
              <Link href="/admin" className="ml-1 lg:ml-2 text-white bg-blue-900 px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium flex items-center hover:bg-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex-shrink-0">
                <LayoutDashboard size={14} className="mr-1 lg:mr-1.5" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
            )}

            

            {/* AUTH SECTION */}
            <div className="pl-2 lg:pl-4 ml-1 lg:ml-2 border-l border-gray-200 flex-shrink-0">
              {!firebaseUser ? (
                <Link href="/login" className="bg-blue-600 text-white px-4 lg:px-5 py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium hover:bg-blue-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap">
                  Login
                </Link>
              ) : (
                <UserMenu 
                  firebaseUser={firebaseUser} 
                  userData={mysqlData} 
                  handleLogout={handleLogout}
                  onProfileUpdate={handleProfileUpdateCallback}
                  mobile={false} 
                />
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU (Slide Down) --- */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white border-t border-gray-100 shadow-xl pb-6 scroll-auto max-h-[90vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-2 flex flex-col">
            <NavLink mobile href="/" onClick={() => setIsOpen(false)}>Home</NavLink>
            <NavLink mobile href="/ministries" onClick={() => setIsOpen(false)}>Ministries</NavLink>
            <NavLink mobile href="/about" onClick={() => setIsOpen(false)}>About</NavLink>
            <NavLink mobile href="/books" onClick={() => setIsOpen(false)}>Books</NavLink>
            <NavLink mobile href="/blogs" onClick={() => setIsOpen(false)}>Blogs</NavLink> 
            
            {!isPublic && (
               <NavLink mobile href="/news" onClick={() => setIsOpen(false)} className="text-blue-600 font-semibold">News</NavLink>
            )}

            {canAccessDashboard && (
              <Link 
                href="/admin" 
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-3 py-3 mt-2 text-blue-900 font-bold bg-blue-50 rounded-lg"
              >
                 <LayoutDashboard size={18} className="mr-2" /> Dashboard
              </Link>
            )}
                        
            {!firebaseUser ? (
               <Link 
                 href="/login" 
                 onClick={() => setIsOpen(false)}
                 className="block w-full text-center mt-4 px-4 py-3 font-bold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
               >
                 Login
               </Link>
            ) : (
              // LOGGED IN MOBILE VIEW
              <div className="border-t border-gray-100 mt-4 pt-4">
                {/* 1. Static User Info Header */}
                <div className="flex items-center px-2 mb-2">
                  <img 
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" 
                    src={mysqlData.photoUrl || `https://ui-avatars.com/api/?name=${mysqlData.fullName || "User"}`} 
                    alt="" 
                  />
                  <div className="ml-3 min-w-0">
                    <div className="text-base font-bold text-gray-800 truncate">{mysqlData.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{firebaseUser.email}</div>
                  </div>
                </div>
                
                {/* 2. User Menu Actions */}
                <UserMenu 
                   firebaseUser={firebaseUser}
                   userData={mysqlData}
                   handleLogout={handleLogout}
                   onProfileUpdate={handleProfileUpdateCallback}
                   mobile={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}