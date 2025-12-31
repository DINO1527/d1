"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, UserCheck } from 'lucide-react';
import { auth } from '@/lib/firebase'; // Needed for requester ID in search

// Icons
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const RosterManager = () => {
  const [templates, setTemplates] = useState([]);
  const [roles, setRoles] = useState([]); 
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [lastStatus, setLastStatus] = useState(null);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null, week_number: 1, role_id: '', person_name: '', is_alternative: false, user_uid: null
  });

  // Suggestion State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Role State
  const [isAddingNewRole, setIsAddingNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const getNextSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()) % 7);
    return d.toISOString().split('T')[0];
  };
  const [generateDate, setGenerateDate] = useState(getNextSunday());

  useEffect(() => {
    fetchTemplates();
    fetchStatus();
    fetchRoles();

    // Close suggestions on click outside
    function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setShowSuggestions(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTemplates = async () => {
    try { const res = await axios.get('/api/admin/roster'); setTemplates(res.data); } catch (err) {}
  };

  const fetchStatus = async () => {
    try { const res = await axios.get('/api/admin/roster?action=status'); setLastStatus(res.data); } catch (err) {}
  };

  const fetchRoles = async () => {
    try {
        const res = await axios.get('/api/admin/roster?action=roles');
        setRoles(res.data);
        if(res.data.length > 0 && !formData.role_id) {
            setFormData(prev => ({ ...prev, role_id: res.data[0].id }));
        }
    } catch (err) { }
  };

  // --- SUGGESTION LOGIC ---
  const handleNameChange = async (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, person_name: val, user_uid: null })); // Clear UID on edit
    
    if(val.length > 1) {
        try {
            // Use existing user search API
            const requester = auth.currentUser?.uid;
            if(!requester) return; 

            const res = await axios.get(`/api/admin/users/search?q=${val}&requester=${requester}`);
            setSuggestions(res.data || []);
            setShowSuggestions(true);
        } catch(err) {
            setSuggestions([]);
        }
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const selectUser = (user) => {
    setFormData(prev => ({
        ...prev,
        person_name: user.fullName,
        user_uid: user.firebaseUid
    }));
    setShowSuggestions(false);
  };

  // --- HANDLERS ---
  const handleCreateRole = async () => {
    if(!newRoleName.trim()) return alert("Enter role name");
    try {
        await axios.post('/api/admin/roster', { action: 'create_role', role_name: newRoleName });
        setNewRoleName("");
        setIsAddingNewRole(false);
        fetchRoles(); 
    } catch(err) { alert("Failed to add role"); }
  };

  const handleGenerate = async () => {
    if(!confirm(`Confirm: Assign Week ${selectedWeek} Template to ${generateDate}?`)) return;
    
    try {
        await axios.post('/api/admin/roster', { 
            action: 'generate', 
            date: generateDate, 
            week_template_num: selectedWeek 
        });
        alert("Success! Roster Generated.");
        fetchStatus();
    } catch (err) {
        if (err.response && err.response.status === 409) {
            if (confirm("A roster already exists for this date. Overwrite it?")) {
                await axios.post('/api/admin/roster', { 
                    action: 'generate', date: generateDate, week_template_num: selectedWeek, overwrite: true 
                });
                alert("Roster overwritten!");
                fetchStatus();
            }
        } else {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this person?")) return;
    try { await axios.delete(`/api/admin/roster?id=${id}`); fetchTemplates(); } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updateLive = confirm("Update future live rosters too?");
        await axios.put('/api/admin/roster', { ...formData, update_live: updateLive });
      } else {
        await axios.post('/api/admin/roster', { ...formData, week_number: selectedWeek });
      }
      
      setFormData(prev => ({ ...prev, person_name: '', id: null, is_alternative: false, user_uid: null }));
      setIsEditing(false);
      fetchTemplates();
    } catch (err) {
        alert("Error saving: " + err.message);
    }
  };

  const startEdit = (item) => {
    setIsEditing(true);
    setFormData({ 
        ...item, 
        is_alternative: !!item.is_alternative,
        role_id: item.role_id,
        user_uid: item.user_uid // Load saved UID if any
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const suggestedWeek = lastStatus ? (lastStatus.source_week_number % 5) + 1 : 1;
  const lastDateFormatted = lastStatus ? new Date(lastStatus.service_date).toLocaleDateString() : 'N/A';

  return (
    <div className="p-4 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      
      {/* TOP DASHBOARD */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-blue-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Roster Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1">
                   Last Roster: <span className="font-semibold text-gray-800">{lastDateFormatted}</span> using <span className="font-bold text-blue-600">Week {lastStatus?.source_week_number || '?'}</span> Template.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 bg-blue-50 p-3 rounded-md w-full md:w-auto">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase">For This Sunday</label>
                    <input type="date" value={generateDate} onChange={e=>setGenerateDate(e.target.value)} className="p-1 border rounded bg-white text-sm" />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase">Use Template</label>
                    <select value={selectedWeek} onChange={e=>setSelectedWeek(Number(e.target.value))} className="p-1 border rounded bg-white text-sm font-bold">
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>Week {n} {n === suggestedWeek ? '(Suggested)' : ''}</option>)}
                    </select>
                </div>
                <button onClick={handleGenerate} className="bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700 font-semibold text-sm self-end h-9">
                    Assign Now
                </button>
            </div>
        </div>
      </div>

      {/* NAVIGATION BAR */}
      <div className="bg-white rounded-t-lg shadow-sm border-b overflow-hidden mb-0">
         <div className="flex overflow-x-auto">
            {[1, 2, 3, 4, 5].map(num => (
            <button key={num} onClick={() => setSelectedWeek(num)} 
                className={`flex-1 min-w-[80px] py-4 text-sm font-bold tracking-wide transition-colors
                ${selectedWeek === num ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                WEEK {num}
            </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* LEFT COLUMN: Editor Form */}
        <div className="lg:col-span-4 bg-white p-5 rounded-lg shadow h-fit sticky top-4 border-t-4 border-gray-200">
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">
            {isEditing ? 'Edit Entry' : `Add to Week ${selectedWeek}`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ROLE SELECTOR */}
            {!isEditing && (
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                        {!isAddingNewRole && (
                             <button type="button" onClick={()=>setIsAddingNewRole(true)} className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded text-gray-700">+ New Role</button>
                        )}
                    </div>

                    {!isAddingNewRole ? (
                        <select 
                            className="w-full border border-gray-300 p-2 rounded text-gray-800 bg-white"
                            value={formData.role_id}
                            onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                        >
                            {roles.length === 0 && <option>Loading roles...</option>}
                            {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input type="text" autoFocus className="flex-1 border border-blue-300 p-2 rounded outline-none ring-1 ring-blue-200" placeholder="Enter role name..." value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} />
                            <button type="button" onClick={handleCreateRole} className="bg-green-600 text-white px-3 rounded text-sm">Save</button>
                            <button type="button" onClick={()=>setIsAddingNewRole(false)} className="bg-gray-300 text-gray-700 px-3 rounded text-sm">X</button>
                        </div>
                    )}
                </div>
            )}
            
            {isEditing && (
                 <div className="text-sm bg-blue-50 p-2 rounded text-blue-800 mb-2">
                    Editing Role: <b>{roles.find(r => r.id == formData.role_id)?.role_name}</b>
                 </div>
            )}
            
            {/* AUTOCOMPLETE NAME INPUT */}
            <div className="relative" ref={wrapperRef}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Person Name</label>
                <div className="relative">
                    <input 
                        type="text" required 
                        className={`w-full border p-2 rounded pr-8 ${formData.user_uid ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                        value={formData.person_name} 
                        onChange={handleNameChange} 
                        placeholder="Type to search database..." 
                    />
                    {formData.user_uid && <UserCheck className="absolute right-2 top-2.5 text-green-600" size={16}/>}
                </div>
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                        {suggestions.map((u) => (
                            <div 
                                key={u.firebaseUid} 
                                onClick={() => selectUser(u)}
                                className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b last:border-0"
                            >
                                <span className="font-bold">{u.fullName}</span> <span className="text-xs text-gray-500">({u.email})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center bg-gray-50 p-2 rounded">
                <input type="checkbox" id="isAlt" checked={formData.is_alternative} onChange={(e) => setFormData({...formData, is_alternative: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="isAlt" className="ml-2 text-sm text-gray-700">Backup / Alternative Staff</label>
            </div>

            <div className="flex gap-2 pt-2">
                <button type="submit" className={`flex-1 py-2 text-white font-medium rounded shadow-sm ${isEditing ? 'bg-orange-500' : 'bg-green-600'}`}>
                    {isEditing ? 'Save Changes' : 'Add Person'}
                </button>
                {isEditing && <button type="button" onClick={()=>{setIsEditing(false); setFormData({...formData, person_name:'', id:null, is_alternative: false, user_uid: null});}} className="px-3 bg-gray-200 text-gray-600 rounded">Cancel</button>}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Table */}
        <div className="lg:col-span-8 bg-white rounded-lg shadow overflow-hidden border-t-4 border-blue-600">
            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                <span className="font-bold text-gray-700">Template for Week {selectedWeek}</span>
                <span className="text-xs text-gray-500">{templates.filter(t => t.week_number === selectedWeek).length} assignments</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b">
                            <th className="p-4 font-bold">Role</th>
                            <th className="p-4 font-bold">Assigned Person</th>
                            <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {templates.filter(t => t.week_number === selectedWeek).map((item) => (
                            <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-4 text-gray-900 font-medium text-sm">{item.role_name}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm ${item.user_uid ? 'text-blue-700 font-bold' : 'text-gray-800'}`}>{item.person_name}</span>
                                        {item.user_uid && <UserCheck size={14} className="text-green-500" title="Linked to Database User"/>}
                                        {item.is_alternative ? (
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-full">Alt</span>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => startEdit(item)} className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Edit">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-100 rounded text-red-600" title="Delete">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {templates.filter(t => t.week_number === selectedWeek).length === 0 && (
                     <div className="p-8 text-center text-gray-400 text-sm">No assignments found for Week {selectedWeek}.</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default RosterManager;