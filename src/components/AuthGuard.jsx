"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children, allowedRoles = [] }) {
  const [status, setStatus] = useState('loading'); // 'loading', 'authorized', 'unauthorized'
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // 1. No User -> Redirect to Login
        router.push('/login');
        setStatus('unauthorized');
      } else {
        // 2. User Exists -> Check Roles
        // If allowedRoles is provided, we strictly check against it.
        if (allowedRoles && allowedRoles.length > 0) {
          const userRole = localStorage.getItem('userRole');
          
          // Check if the user's role is in the allowed list
          // Note: We also permit 'admin' by default as a fail-safe (Super Admin), 
          // but you can remove the "|| userRole === 'admin'" part if you want strict array adherence.
          if (allowedRoles.includes(userRole) || userRole === 'admin') {
            setStatus('authorized');
          } else {
            // Logged in but wrong role -> Redirect Home or Unauthorized page
            router.push('/');
            setStatus('unauthorized');
          }
        } else {
          // 3. No specific roles defined -> Authorized (Any logged-in user)
          setStatus('authorized');
        }
      }
    });

    return () => unsubscribe();
  }, [router, allowedRoles]);

  // LOADING STATE
  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium text-sm animate-pulse">Verifying access...</p>
      </div>
    );
  }

  // If unauthorized, render nothing (router is redirecting)
  if (status === 'unauthorized') {
    return null;
  }

  // If authorized, render the protected page
  return <>{children}</>;
}