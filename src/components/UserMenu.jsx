"use client";
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function UserMenu({ firebaseUser, userData, handleLogout, mobile = false }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside (Only for desktop)
  useEffect(() => {
    if (mobile) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobile]);

  // Display Name logic (Fallbacks)
  const displayPhoto = userData.photoUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'User')}&background=random`;

  return (
    <div className={mobile ? "w-full" : "relative ml-3"} ref={dropdownRef}>
      
      {/* 1. DESKTOP VIEW: Avatar + Dropdown */}
      {!mobile && (
        <>
          <div>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all hover:scale-105"
            >
              <img
                className="h-9 w-9 rounded-full object-cover"
                src={displayPhoto}
                alt="User Profile"
              />
            </button>
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-4 border-b bg-gray-50 rounded-t-xl">
                <p className="text-sm text-gray-900 font-bold text-lg">{userData.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{firebaseUser.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {userData.role || 'Member'}
                  </span>
                </div>
              </div>
              
              <Link 
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
              >
                <Settings size={18} className="mr-3 text-gray-500" /> Profile Settings
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors border-t"
              >
                <LogOut size={18} className="mr-3" /> Sign out
              </button>
            </div>
          )}
        </>
      )}

      {/* 2. MOBILE VIEW: Flat Buttons */}
      {mobile && (
        <div className="mt-2 space-y-1">
          <Link 
            href="/settings"
            className="w-full text-left px-2 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg flex items-center transition-colors"
          >
            <Settings size={20} className="mr-3 text-gray-400" /> Profile Settings
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-2 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center transition-colors"
          >
            <LogOut size={20} className="mr-3" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}