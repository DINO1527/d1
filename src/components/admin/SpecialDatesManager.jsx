"use client";
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Trash2 } from 'lucide-react';

const groupByCategory = (data, key) => {
  return data.reduce((acc, item) => {
    const category = item[key] || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
};

export default function SpecialDatesManager() {
  const [dates, setDates] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ person_name: '', event_type: 'birthday', event_date: '', details: '' });

  const fetchDates = useCallback(async () => {
    const res = await fetch('/api/admin/special-dates');
    if(res.ok) setDates(await res.json());
  }, []);
  useEffect(() => { fetchDates(); }, [fetchDates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/admin/special-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      alert("Saved!");
      setFormData({ person_name: '', event_type: 'birthday', event_date: '', details: '' });
      fetchDates();
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
      if(!confirm("Remove entry?")) return;
      await fetch(`/api/admin/special-dates/${id}`, { method: 'DELETE' });
      fetchDates();
  };

  const groupedDates = groupByCategory(dates, 'event_type');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-yellow-500 h-fit">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Event</h2>
        <input required placeholder="Name" className="input-field w-full mb-3" value={formData.person_name} onChange={e => setFormData({...formData, person_name: e.target.value})} />
        <select className="input-field w-full mb-3" value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})}>
           <option value="birthday">Birthday</option>
           <option value="anniversary">Anniversary</option>
        </select>
        <input required type="date" className="input-field w-full mb-3" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
        <input placeholder="Details (e.g. 50th)" className="input-field w-full mb-4" value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} />
        <button disabled={isSubmitting} className="btn-primary bg-yellow-600 hover:bg-yellow-700 w-full">Save</button>
      </form>

      <div className="col-span-2 space-y-6">
         {['birthday', 'anniversary'].map(type => (
           <div key={type} className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-700 uppercase mb-3 border-b pb-2">{type}s</h3>
              <ul className="space-y-3">
                 {groupedDates[type]?.map(d => (
                   <li key={d.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded">
                      <span>
                          <span className="font-bold text-gray-800">{d.person_name}</span>
                          <span className="text-gray-500 ml-2">({new Date(d.event_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})})</span>
                          <span className="text-gray-400 text-xs ml-2">{d.details}</span>
                      </span>
                      <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                   </li>
                 ))}
                 {!groupedDates[type] && <p className="text-gray-400 text-xs italic">No entries yet.</p>}
              </ul>
           </div>
         ))}
      </div>
    </div>
  );
}