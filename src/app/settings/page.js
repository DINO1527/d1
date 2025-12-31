"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, LogOut, Save, Mail, User, Phone, MapPin, Globe, Loader2, ShieldAlert } from 'lucide-react';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase'; // Ensure this path is correct

export default function SettingsPage() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState(null); // Firebase User
  const [dbData, setDbData] = useState({
    fullName: '',
    churchName: '',
    contactNumber: '',
    language: 'Tamil',
    photoUrl: '',
    role: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch User Data on Mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      try {
        // Fetch current data from MySQL via your sync endpoint (or a new GET endpoint)
        // Re-using sync endpoint here since it returns user data if exists
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: currentUser.uid, email: currentUser.email })
        });
        
        if (res.ok) {
          const data = await res.json();
          setDbData({
            fullName: data.fullName || '',
            churchName: data.churchName || '',
            contactNumber: data.contactNumber || '',
            language: data.language || 'Tamil',
            photoUrl: data.photoUrl || '',
            role: data.role || 'public',
            email: data.email || currentUser.email
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Handle Image Upload to Supabase
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (e.g., max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}-${Date.now()}.${fileExt}`;
      const filePath = `profile_photos/${fileName}`;

      // Upload to Supabase Bucket 'profile_photo'
      const { error: uploadError } = await supabase.storage
        .from('profile_photo')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_photo')
        .getPublicUrl(filePath);

      // Update State immediately for preview
      setDbData(prev => ({ ...prev, photoUrl: publicUrl }));
      
      // Auto-save the new photo URL to MySQL
      await saveProfile({ ...dbData, photoUrl: publicUrl });

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // 3. Save Profile Changes
  const saveProfile = async (dataToSave = dbData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          ...dataToSave
        })
      });

      if (!res.ok) throw new Error('Failed to update');
      // Optional: Show a toast notification here
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // 4. Handle Password Reset
  const handlePasswordReset = async () => {
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        alert(`Password reset link sent to ${user.email}`);
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  // 5. Handle Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Helper: Is Google Auth?
  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

  // Helper: Default Avatar
  const displayAvatar = dbData.photoUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(dbData.fullName || 'User')}&background=random&size=200`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>
          <div className="w-16"></div> {/* Spacer for alignment */}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          
          <div className="px-6 pb-6 relative">
            {/* Avatar Upload */}
            <div className="-mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end sm:space-x-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  <img 
                    src={displayAvatar} 
                    alt="Profile" 
                    className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`}
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Camera Button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="mt-4 sm:mt-0 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">{dbData.fullName || 'New Member'}</h2>
                <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-1">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider">
                    {dbData.role === 'public' ? dbData.role : dbData.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <User size={16} className="mr-2 text-gray-800" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={dbData.fullName}
                    onChange={(e) => setDbData({...dbData, fullName: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border text-blue-900 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Church Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" /> Church Name
                  </label>
                  <input
                    type="text"
                    value={dbData.churchName}
                    onChange={(e) => setDbData({...dbData, churchName: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border text-blue-900 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Phone size={16} className="mr-2 text-gray-400" /> Contact Number
                  </label>
                  <input
                    type="tel"
                    value={dbData.contactNumber}
                    onChange={(e) => setDbData({...dbData, contactNumber: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border text-blue-900 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="+94 77 123 4567"
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Globe size={16} className="mr-2 text-gray-400" /> Congregation Language
                  </label>
                  <select
                    value={dbData.language}
                    onChange={(e) => setDbData({...dbData, language: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border text-blue-900 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="Tamil">Tamil</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              {/* Read Only Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail size={16} className="mr-2 text-gray-400" /> Email Address
                </label>
                <div className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500">
                  {dbData.email}
                </div>
                <p className="text-xs text-gray-400 pl-1">Email cannot be changed manually.</p>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center bg-blue-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-orange-500" /> Security
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Password Reset</p>
                <p className="text-sm text-gray-500">
                  {isGoogleUser 
                    ? "You are logged in via Google. Please manage your password through Google." 
                    : "Receive an email to reset your account password."}
                </p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={isGoogleUser}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                  ${isGoogleUser 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-blue-600'
                  }`}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-medium p-4 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </button>

      </main>
    </div>
  );
}