"use client";
import { useState, useEffect, useRef } from 'react';
import { Users, Loader2, Search, CheckCircle, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase'; // Ensure we can get current user UID

export default function UserManager() {
  // State
  const [currentUserRole, setCurrentUserRole] = useState(''); // 'admin' or 'editor'
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('public');
  
  // List State
  const [userList, setUserList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // UI State
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  
  const dropdownRef = useRef(null);

  // 1. Get Current Logged In User Role & Fetch List
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setCurrentUserRole(role);

    // Initial Fetch of User List
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user && (role === 'admin' || role === 'editor')) {
            fetchUserList(user.uid);
        }
    });
    return () => unsubscribe();
  }, []);

  // Helper: Fetch User List
  const fetchUserList = async (uid) => {
    setLoadingList(true);
    try {
        const res = await fetch(`/api/admin/roles/allusers?requester=${uid}`);
        if(res.ok) {
            const data = await res.json();
            setUserList(data);
        }
    } catch(err) {
        console.error("Failed to load users", err);
    } finally {
        setLoadingList(false);
    }
  };

  // 2. Handle Search Input (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2 && !selectedUser) {
        setIsSearching(true);
        try {
          const uid = auth.currentUser?.uid;
          const res = await fetch(`/api/admin/roles/search?q=${query}&requester=${uid}`);
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300); // Wait 300ms after typing stops

    return () => clearTimeout(timer);
  }, [query, selectedUser]);

  // 3. Select a User from Suggestions
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setQuery(user.email);
    setNewRole(user.role); // Pre-select their current role
    setSuggestions([]);
    setMessage(null);
  };

  // 4. Handle Role Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
        setMessage({ type: 'error', text: 'Please select a valid user from the list.' });
        return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/roles/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetEmail: selectedUser.email, 
          newRole, 
          requesterUid: auth.currentUser?.uid 
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update");

      setMessage({ type: 'success', text: data.message });
      // Reset after success
      setTimeout(() => {
        setQuery('');
        setSelectedUser(null);
        setNewRole('public');
        setMessage(null);
        // Refresh the list to show new role
        fetchUserList(auth.currentUser?.uid);
      }, 2000);

    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setSuggestions([]);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- RENDER ---
  return (
    <div className="grid md:grid-cols-3 gap-8">
        
      {/* --- LEFT: UPDATE FORM --- */}
      <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-600 h-fit">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
                <Users className="text-purple-600" size={24}/>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Roles</h2>
                <p className="text-xs text-gray-500">Assign permissions</p>
            </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* EMAIL SEARCH INPUT */}
            <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none transition
                            ${selectedUser ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                        `}
                        placeholder="Type name or email..." 
                        value={query} 
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedUser(null); // Reset selection if typing changes
                        }} 
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-3 animate-spin text-purple-600" size={18}/>}
                    {selectedUser && <CheckCircle className="absolute right-3 top-3 text-green-600" size={18}/>}
                </div>

                {/* GMAIL STYLE SUGGESTIONS DROPDOWN */}
                {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {suggestions.map(user => (
                            <div 
                                key={user.firebaseUid} 
                                onClick={() => handleSelectUser(user)}
                                className="flex items-center gap-3 p-3 hover:bg-purple-50 cursor-pointer border-b last:border-0 transition"
                            >
                                <img 
                                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} 
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt=""
                                />
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{user.fullName}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium
                                    ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                                    user.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                                `}>
                                    {user.role}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ROLE SELECTION */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                <div className="relative">
                    <Shield className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <select 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-200 outline-none" 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value)}
                        disabled={!selectedUser}
                    >
                        <option value="public">Public (Guest)</option>
                        <option value="member">Member</option>
                        <option value="creator">Creator</option>
                        
                        {/* HIDE ADMIN/EDITOR OPTIONS IF CURRENT USER IS ONLY AN EDITOR */}
                        {currentUserRole === 'admin' && (
                            <>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </>
                        )}
                    </select>
                </div>
                {currentUserRole === 'editor' && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                        * Editors can only assign Public or Member roles.
                    </p>
                )}
            </div>

            {/* FEEDBACK MESSAGE */}
            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    {message.text}
                </div>
            )}

            {/* ACTION BUTTON */}
            <button 
                disabled={isSubmitting || !selectedUser} 
                className={`w-full py-3 rounded-lg font-bold text-white transition flex justify-center items-center gap-2
                    ${isSubmitting || !selectedUser ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg'}
                `}
            >
                {isSubmitting ? <Loader2 className="animate-spin"/> : "Update User Role"}
            </button>

        </form>
      </div>

      {/* --- RIGHT: USER LIST TABLE --- */}
      <div className="md:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[600px]">
         <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Registered Users</h3>
            <button 
                onClick={() => fetchUserList(auth.currentUser?.uid)} 
                className="text-gray-500 hover:text-purple-600 transition"
                title="Refresh List"
            >
                <RefreshCw size={18} className={loadingList ? 'animate-spin' : ''}/>
            </button>
         </div>
         
         <div className="overflow-y-auto flex-grow p-0">
            {loadingList ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-purple-600" size={32}/>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {userList.map(user => (
                            <tr key={user.firebaseUid} className="hover:bg-purple-50 transition">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <img 
                                        src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} 
                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                        alt=""
                                    />
                                    <span className="font-medium text-gray-900">{user.fullName || "No Name"}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                                        ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                                          user.role === 'editor' ? 'bg-blue-100 text-blue-700' : 
                                          user.role === 'member' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                            </tr>
                        ))}
                        {userList.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
         </div>
      </div>

    </div>
  );
}