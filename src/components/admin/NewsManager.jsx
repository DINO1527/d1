"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Loader2, Save, Trash2, Type, AlignLeft, RefreshCw, Globe, Keyboard as KeyboardIcon, X, Wand2, Settings2, History } from 'lucide-react';
import { convertChar } from '@/lib/LegacyConverters'; // Ensure this file exists as created previously

// --- FONT STYLES ---
const getFontClass = (lang) => {
  switch (lang) {
    case 'Tamil': return 'font-tamil';
    case 'Sinhala': return 'font-sinhala';
    default: return 'font-english';
  }
};

// ==================================================================
// 2. MAIN COMPONENT
// ==================================================================

export default function NewsManager() {
  const [news, setNews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // SUGGESTIONS STATE
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  
  // REFS (Defined here to fix the error)
  const descriptionRef = useRef(null);
  
  // FORM STATE
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    news_date: new Date().toISOString().split('T')[0],
    language: "English", // Database Language
  });

  const [typingConfig, setTypingConfig] = useState({
    language: "English", // Keyboard Layout
    mode: "unicode"      // 'unicode' or 'legacy'
  });

  // --- FETCH NEWS & PROCESS SUGGESTIONS ---
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/news");
      if (res.ok) {
        const data = await res.json();
        
        // Sort Data
        const sorted = data.sort((a, b) => {
          if (new Date(b.news_date) - new Date(a.news_date) !== 0)
            return new Date(b.news_date) - new Date(a.news_date);
          return a.title.localeCompare(b.title);
        });
        setNews(sorted);

        // Extract Unique Titles for Autocomplete
        const uniqueTitles = [...new Set(data.map(item => item.title).filter(t => t && t.trim().length > 0))];
        setSuggestions(uniqueTitles);
      }
    } catch (e) {
      console.error("Failed to fetch news", e);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // --- HANDLE INPUT CHANGE (With Auto-Conversion) ---
  const handleInputChange = (e, field) => {
    const rawValue = e.target.value;
    let newValue = rawValue;

    // Legacy Conversion Logic
    if (typingConfig.mode === 'legacy' && typingConfig.language !== 'English') {
        const oldValue = formData[field];
        // Only convert if adding text (not deleting)
        if (rawValue.length > oldValue.length) {
            const diffIndex = e.target.selectionStart - 1;
            const charTyped = rawValue[diffIndex];
            const convertedChar = convertChar(charTyped, typingConfig.language);
            
            if (convertedChar !== charTyped) {
                newValue = rawValue.substring(0, diffIndex) + convertedChar + rawValue.substring(diffIndex + 1);
                // Fix cursor position (deferred)
                setTimeout(() => {
                    if (e.target) {
                        e.target.selectionStart = diffIndex + 1;
                        e.target.selectionEnd = diffIndex + 1;
                    }
                }, 0);
            }
        }
    }

    setFormData(prev => ({ ...prev, [field]: newValue }));

    // Handle Suggestions (Only for Title)
    if (field === 'title') {
        if (newValue.trim().length > 0) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }
  };

  // --- SELECT SUGGESTION ---
  const selectSuggestion = (title) => {
    setFormData(prev => ({ ...prev, title }));
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    
    // Move focus to description after selection (Logic fixed)
    if (descriptionRef.current) {
        descriptionRef.current.focus();
    }
  };

  // --- KEYBOARD NAVIGATION FOR SUGGESTIONS ---
  const handleTitleKeyDown = (e) => {
    const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(formData.title.toLowerCase()) && 
        s !== formData.title
    ).slice(0, 5);

    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
            selectSuggestion(filtered[activeSuggestionIndex]);
        }
    } else if (e.key === 'Tab') {
        const targetIndex = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
        if(filtered[targetIndex]) {
            e.preventDefault();
            selectSuggestion(filtered[targetIndex]);
        }
    } else if (e.key === 'Escape') {
        setShowSuggestions(false);
    }
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const items = formData.description
        .split("\n")
        .map((i) => i.trim())
        .filter((i) => i !== "");

      if (items.length === 0) {
        alert("Please add at least one news line");
        setIsSubmitting(false);
        return;
      }

      // LANGUAGE SAFEGUARD: Ensure language is never null
      const langToSend = formData.language || 'English';

      for (let desc of items) {
        await fetch("/api/admin/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: desc,
            news_date: formData.news_date,
            language: langToSend,
          }),
        });
      }

      alert("News added successfully!");
      setFormData(prev => ({ ...prev, description: "", title: "" })); 
      setShowSuggestions(false);
      fetchNews();
    } catch (err) {
      console.error(err);
      alert("Error adding news");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this news item?")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" }); 
    fetchNews();
  };

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(formData.title.toLowerCase()) && 
    s !== formData.title
  ).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Sinhala:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&display=swap');
        .font-english { font-family: 'Noto Sans', sans-serif; }
        .font-tamil { font-family: 'Noto Sans Tamil', sans-serif; }
        .font-sinhala { font-family: 'Noto Sans Sinhala', sans-serif; }
        .notebook-lines {
          background-image: linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 2rem;
          line-height: 2rem;
        }
      `}</style>

      {/* --- EDITOR SECTION --- */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative z-10">
        
        {/* --- TOP TOOLBAR (Settings & Date) --- */}
        <div className="bg-slate-100 border-b border-slate-200 p-3 flex flex-wrap items-center gap-4 justify-between">
          
          <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Type size={20} /></div>
            News Editor
          </div>

          <div className="flex items-center gap-3">
             {/* CONGREGATION LANGUAGE (Database Tag) */}
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
                <Globe size={16} className="text-green-600" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Save As:</span>
                <select
                  className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Sinhala">Sinhala</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="date"
                  required
                  className="bg-transparent text-sm text-slate-700 outline-none"
                  value={formData.news_date}
                  onChange={(e) => setFormData({ ...formData, news_date: e.target.value })}
                />
              </div>
          </div>
        </div>

        {/* --- SECONDARY TOOLBAR (Typing Tools) --- */}
        <div className="bg-white border-b border-slate-100 p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
                <Settings2 size={14} /> Typing Tools
            </div>

            <select
              className="bg-slate-50 border border-slate-200 text-sm rounded-md px-3 py-1.5 outline-none focus:border-blue-400 transition-colors cursor-pointer text-slate-700 font-medium"
              value={typingConfig.language}
              onChange={(e) => setTypingConfig({ ...typingConfig, language: e.target.value })}
            >
              <option value="English">English Input</option>
              <option value="Tamil">Tamil Input</option>
              <option value="Sinhala">Sinhala Input</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => setTypingConfig({ ...typingConfig, mode: 'unicode' })}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${typingConfig.mode === 'unicode' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Standard
                </button>
                <button
                    onClick={() => setTypingConfig({ ...typingConfig, mode: 'legacy' })}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${typingConfig.mode === 'legacy' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Wand2 size={12}/> Legacy
                </button>
            </div>
        </div>

        {/* --- INPUT AREA --- */}
        <div className="p-8 bg-white min-h-[400px]">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* TITLE INPUT WITH AUTOCOMPLETE */}
            <div className="relative">
                <input
                    required
                    placeholder="Enter Headline / Title..."
                    className={`w-full text-2xl font-bold text-slate-800 placeholder:text-slate-300 outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors pb-2 ${getFontClass(typingConfig.language)}`}
                    value={formData.title}
                    onChange={(e) => handleInputChange(e, 'title')}
                    onKeyDown={handleTitleKeyDown}
                    onFocus={() => { if(formData.title) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                    autoComplete="off"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 z-50 overflow-hidden">
                        <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 flex items-center gap-2">
                            <History size={12} /> Previous Headlines
                        </div>
                        {filteredSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                type="button" // Important: Prevents form submission
                                onMouseDown={(e) => e.preventDefault()} // Important: Prevents blur before click
                                onClick={() => selectSuggestion(suggestion)}
                                className={`
                                    w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 text-sm font-medium transition-colors
                                    ${idx === activeSuggestionIndex ? 'bg-blue-100 text-blue-800' : 'text-slate-700 hover:bg-blue-50'}
                                    ${getFontClass(formData.language)}
                                `} 
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
              <textarea
                ref={descriptionRef} // Attached Ref
                required
                placeholder={typingConfig.mode === 'legacy' 
                    ? `Type using ${typingConfig.language} Legacy layout (e.g., Bamini/Wijesekara). Text will convert automatically.` 
                    : "Type your news here (Press Enter for new point)..."}
                className={`w-full h-[300px] text-lg text-slate-700 placeholder:text-slate-300 outline-none resize-y notebook-lines ${getFontClass(typingConfig.language)}`}
                value={formData.description}
                onChange={(e) => handleInputChange(e, 'description')}
              />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting ? "Publish News" : "Publish News"}
          </button>
        </div>
      </div>

      {/* --- RECENT NEWS LIST --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative z-0">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><AlignLeft size={18}/> Recent News Items</h3>
          <button onClick={fetchNews} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"><RefreshCw size={16}/></button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Saved As</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold w-1/3">Content</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {news.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No news items found.</td></tr>
              ) : news.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{new Date(r.news_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      r.language === 'English' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      r.language === 'Tamil' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {r.language}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold text-slate-800 ${getFontClass(r.language)}`}>{r.title}</td>
                  <td className={`px-6 py-4 text-slate-600 ${getFontClass(r.language)}`}>{r.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Delete News"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}