"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Shield, User, Home, Loader2, Phone, Globe, Camera, ArrowRight, Check } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase'; // Ensure you have this file

export default function LoginPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [view, setView] = useState('login'); // 'login', 'signup', 'complete-profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    churchName: 'The Grace Evangelical Church',
    language: 'Tamil',
    contactNumber: '',
    photoUrl: ''
  });
  
  // Google User Cache (Temporary storage during completion step)
  const [googleUser, setGoogleUser] = useState(null);
  
  // File Upload State
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- HANDLERS ---

  // 1. INPUT CHANGE
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // 2. IMAGE UPLOAD (Supabase)
  const handleFileUpload = async (fileToUpload) => {
    if (!fileToUpload) return null;
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Date.now()}-profile.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('profile_photo').upload(fileName, fileToUpload);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('profile_photo').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // 3. FINAL SYNC TO MYSQL
  const finalizeLogin = async (firebaseUser, extraData = {}) => {
    try {
      const payload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: extraData.fullName || firebaseUser.displayName || formData.fullName,
        photoUrl: extraData.photoUrl || firebaseUser.photoURL || formData.photoUrl,
        churchName: extraData.churchName || formData.churchName,
        language: extraData.language || formData.language,
        contactNumber: extraData.contactNumber || formData.contactNumber,
        checkOnly: false // Create/Update
      };

      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Sync Failed");
      const dbUser = await res.json();

      // Store Role & Redirect
      localStorage.setItem('userRole', dbUser.role);
      
      if (dbUser.role === 'admin' || dbUser.role === 'editor') router.push('/admin');
      else if (dbUser.role === 'member') router.push('/');
      else router.push('/'); // Public/Default

    } catch (err) {
      console.error(err);
      setError("Failed to save profile data. Please try again.");
      setLoading(false);
    }
  };

  // 4. GOOGLE AUTH START
  const handleGoogleStart = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in DB
      const checkRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email, checkOnly: true })
      });

      if (checkRes.ok) {
        // User exists -> Login directly
        await finalizeLogin(user);
      } else if (checkRes.status === 404) {
        // New User -> Go to Complete Profile
        setGoogleUser(user);
        setFormData(prev => ({
          ...prev,
          email: user.email,
          fullName: user.displayName || '',
          photoUrl: user.photoURL || '',
          churchName: 'The Grace Evangelical Church', // Default
          language: 'Tamil' // Default
        }));
        setView('complete-profile');
        setLoading(false);
      } else {
        throw new Error("Server Error");
      }
    } catch (err) {
      console.error(err);
      setError("Google Sign-In failed.");
      setLoading(false);
    }
  };

  // 5. FORM SUBMIT (Login or Signup)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'login') {
        // --- LOGIN FLOW ---
        const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        await finalizeLogin(cred.user);

      } else if (view === 'signup') {
        // --- EMAIL SIGNUP FLOW ---
        // Validate
        if (!/^\d{9,15}$/.test(formData.contactNumber)) throw new Error("Invalid phone number");
        
        let photoUrl = formData.photoUrl;
        if (file) photoUrl = await handleFileUpload(file);

        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(cred.user, { displayName: formData.fullName, photoURL: photoUrl });
        
        await finalizeLogin(cred.user, { ...formData, photoUrl });

      } else if (view === 'complete-profile') {
        // --- GOOGLE COMPLETION FLOW ---
        if (!/^\d{9,15}$/.test(formData.contactNumber)) throw new Error("Invalid phone number");

        let photoUrl = formData.photoUrl;
        if (file) photoUrl = await handleFileUpload(file);

        // Update Firebase Profile with new data if changed
        if (googleUser) {
            await updateProfile(googleUser, { 
                displayName: formData.fullName, 
                photoURL: photoUrl 
            });
            await finalizeLogin(googleUser, { ...formData, photoUrl });
        }
      }
    } catch (err) {
      setLoading(false);
      if (err.message.includes('auth/invalid-credential')) setError("Invalid email or password.");
      else if (err.message.includes('auth/email-already-in-use')) setError("Email already in use.");
      else setError(err.message || "Authentication failed.");
    }
  };

  // --- RENDER HELPERS ---
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFormData({ ...formData, photoUrl: URL.createObjectURL(e.target.files[0]) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* CARD CONTAINER */}
      <motion.div 
        layout
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative min-h-[600px]"
      >
        {/* --- LEFT SIDE: IMAGE / INFO --- */}
        <div className={`md:w-1/2 bg-blue-900 text-white p-12 flex flex-col justify-between transition-all duration-500
            ${view === 'login' ? 'order-1' : 'order-2 md:order-2'}
        `}>
           <div>
             <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Shield className="text-white" size={24}/>
             </div>
             <h1 className="text-4xl font-bold mb-4">
               {view === 'login' ? "Welcome Back!" : "Join Our Family"}
             </h1>
             <p className="text-blue-100 leading-relaxed opacity-90">
               {view === 'login' 
                 ? "Access your dashboard, manage rosters, and stay connected with The Grace Evangelical Church." 
                 : "Create an account to become a member, access exclusive content, and participate in church activities."}
             </p>
           </div>

           {/* Switcher Text */}
           {view !== 'complete-profile' && (
             <div className="mt-12">
               <p className="text-sm text-blue-200 mb-2">
                 {view === 'login' ? "Don't have an account?" : "Already have an account?"}
               </p>
               <button 
                 onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                 className="px-6 py-2 border border-white/30 rounded-full text-sm font-bold hover:bg-white hover:text-blue-900 transition-colors"
               >
                 {view === 'login' ? "Sign Up Now" : "Sign In"}
               </button>
             </div>
           )}
        </div>

        {/* --- RIGHT SIDE: FORMS --- */}
        <div className={`md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative
            ${view === 'login' ? 'order-2' : 'order-1 md:order-1'}
        `}>
           <AnimatePresence mode='wait'>
             
             {/* 1. LOGIN FORM */}
             {view === 'login' && (
               <motion.div 
                 key="login"
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                 
                 <button onClick={handleGoogleStart} className="w-full flex items-center justify-center gap-3 bg-white border border-blue-500 p-3 rounded-xl hover:bg-blue-300 transition shadow-sm font-bold text-gray-900 text-sm">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
                    Continue with Google
                 </button>

                 <div className="flex items-center gap-4 text-xs text-gray-600 font-bold uppercase tracking-wider">
                    <div className="h-px bg-gray-500 flex-grow"></div> OR <div className="h-px bg-gray-500 flex-grow"></div>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-blue-700" size={18}/>
                        <input type="email" name="email" placeholder="Email Address" required
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                            onChange={handleChange} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-blue-700" size={18}/>
                        <input type="password" name="password" placeholder="Password" required
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                            onChange={handleChange} />
                    </div>
                    {error && <div className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}
                    
                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center">
                        {loading ? <Loader2 className="animate-spin"/> : "Login"}
                    </button>
                 </form>
               </motion.div>
             )}

             {/* 2. SIGNUP / COMPLETE PROFILE FORM */}
             {(view === 'signup' || view === 'complete-profile') && (
               <motion.div 
                 key="signup"
                 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                 className="space-y-5"
               >
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {view === 'complete-profile' ? "Complete Profile" : "Create Account"}
                    </h2>
                    {view === 'complete-profile' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Step 2 of 2</span>}
                 </div>

                 {view === 'signup' && (
                    <>
                        <button onClick={handleGoogleStart} className="w-full flex items-center justify-center gap-3 bg-white border border-blue-500 p-3 rounded-xl hover:bg-gray-50 transition shadow-sm font-bold text-gray-700 text-sm">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
                            Sign up with Google
                        </button>
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <div className="h-px bg-gray-200 flex-grow"></div> OR <div className="h-px bg-gray-200 flex-grow"></div>
                        </div>
                    </>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-4">
                    {/* PHOTO UPLOAD */}
                    <div className="flex justify-center mb-4">
                        <div className="relative group cursor-pointer border border-blue-500 rounded-full" onClick={() => fileInputRef.current.click()}>
                            <img 
                                src={formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.fullName || 'User'}&background=random`} 
                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md group-hover:opacity-75 transition"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Camera className="text-gray-700" />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                    </div>

                    {/* FIELDS GRID */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative col-span-2">
                            <User className="absolute left-4 top-3.5 text-blue-500" size={18}/>
                            <input type="text" name="fullName" placeholder="Full Name" required value={formData.fullName}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                onChange={handleChange} />
                        </div>

                        {view === 'signup' && (
                            <>
                                <div className="relative col-span-2">
                                    <Mail className="absolute left-4 top-3.5 text-blue-500" size={18}/>
                                    <input type="email" name="email" placeholder="Email Address" required value={formData.email}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                        onChange={handleChange} />
                                </div>
                                <div className="relative col-span-2">
                                    <Lock className="absolute left-4 top-3.5 text-blue-500" size={18}/>
                                    <input type="password" name="password" placeholder="Password" required value={formData.password}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                        onChange={handleChange} />
                                </div>
                            </>
                        )}

                        <div className="relative col-span-1">
                            <Phone className="absolute left-4 top-3.5 text-blue-500" size={18}/>
                            <input type="tel" name="contactNumber" placeholder="Mobile" required value={formData.contactNumber}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                onChange={handleChange} />
                        </div>

                        <div className="relative col-span-1">
                            <Globe className="absolute left-4 top-3.5 text-blue-500" size={18}/>
                            <select name="language" 
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm appearance-none"
                                value={formData.language} onChange={handleChange}>
                                <option value="Tamil">Tamil</option>
                                <option value="Sinhala">Sinhala</option>
                                <option value="English">English</option>
                            </select>
                        </div>

                        <div className="relative col-span-2">
                            <Home className="absolute left-4 top-3.5 text-blue-500" size={18}/>
                            <input type="text" name="churchName" placeholder="Church Name" required value={formData.churchName}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-blue-500 rounded-xl text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                onChange={handleChange} />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}
                    
                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : (view === 'complete-profile' ? "Finish Setup" : "Create Account")}
                        {!loading && <ArrowRight size={16}/>}
                    </button>
                 </form>
               </motion.div>
             )}

           </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}