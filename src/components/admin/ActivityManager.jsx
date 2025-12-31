
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Filter, Activity, RefreshCw, User, ShieldAlert } from 'lucide-react';
import { auth } from '@/lib/firebase';
import AuthGuard from '@/components/AuthGuard';

export default function ActivityManager() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');

  // Fetch Data
  const fetchLogs = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        requester: auth.currentUser.uid,
        search,
        module: selectedModule,
        action: selectedAction
      });
      
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (error) {
      console.error("Failed to load logs", error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedModule, selectedAction]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) fetchLogs();
    });
    return () => unsubscribe();
  }, [fetchLogs]);

  // Helpers for Badges
  const getActionColor = (action) => {
    switch (action) {
        case 'INSERT': return 'bg-green-100 text-green-700 border-green-200';
        case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
        case 'LOGIN': return 'bg-purple-100 text-purple-700 border-purple-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
        admin: 'bg-red-900 text-white',
        editor: 'bg-indigo-600 text-white',
        creator: 'bg-purple-600 text-white',
        member: 'bg-green-600 text-white',
        public: 'bg-gray-400 text-white',
        Unknown: 'bg-black text-white'
    };
    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colors[role] || colors.public}`}>
            {role}
        </span>
    );
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity size={20} className="text-blue-400"/> System Activity Logs
                </h2>
                <p className="text-slate-400 text-sm mt-1">Monitor user actions and system events</p>
            </div>
            <button 
                onClick={fetchLogs} 
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh
            </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
                <Search className="absolute left-3 top-2.5 text-blue-900" size={18}/>
                <input 
                    className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 bg-white"
                    placeholder="Search by User or Email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="relative">
                <Filter className="absolute left-3 top-2.5 text-blue-900" size={18}/>
                <select 
                    className="w-full pl-10 pr-4 py-2 border border-gray-400 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                >
                    <option value="All">All Modules</option>
                    <option value="BLOG">Blogs</option>
                    <option value="VIDEO">Videos</option>
                    <option value="ROSTER">Roster</option>
                    <option value="DATES">Special Dates</option>
                    <option value="USER">Users</option>
                </select>
            </div>

            <select 
                className="w-full px-4 py-2 border border-gray-400 text-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
            >
                <option value="All">All Actions</option>
                <option value="CREATE">Created</option>
                <option value="UPDATE">Updated</option>
                <option value="DELETE">Deleted</option>
                <option value="LOGIN">Login</option>
            </select>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Module</th>
                        <th className="px-6 py-4">Details</th>
                        <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                <Loader2 className="animate-spin mx-auto mb-2 text-blue-500"/> Loading logs...
                            </td>
                        </tr>
                    ) : logs.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                No activity found matching filters.
                            </td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                            {log.photoUrl ? (
                                                <img src={log.photoUrl} className="w-full h-full object-cover"/>
                                            ) : <User className="p-1.5 text-gray-500 w-full h-full"/>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-xs">{log.fullName || "System/Unknown"}</span>
                                            {log.role && getRoleBadge(log.role)}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getActionColor(log.action_type)}`}>
                                        {log.action_type}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600 font-medium text-xs">
                                    {log.module}
                                </td>
                                <td className="px-6 py-3 text-slate-700 max-w-xs truncate" title={log.details}>
                                    {log.details}
                                </td>
                                <td className="px-6 py-3 text-right text-gray-400 text-xs font-mono">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="bg-gray-50 p-3 border-t border-gray-200 text-center text-xs text-gray-400">
            Showing last {logs.length} records • Secure Audit Trail
        </div>

      </div>
    </AuthGuard>
  );
}