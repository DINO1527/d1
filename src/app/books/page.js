"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, BookOpen, X, CheckCircle, ShoppingBag, MapPin, Phone, User as UserIcon, Home } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookCard from '@/components/BookCard';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookShop() {
  const router = useRouter();
  
  // Data State
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState(['All']);
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // User State
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // From MySQL

  // Modal State
  const [selectedBook, setSelectedBook] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Order Form State
  const [formData, setFormData] = useState({
    full_name: '',
    contact_number: '',
    church_name: '',
    address: '',
    quantity: 1
  });

  // 1. Auth & Data Fetching Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            let dbUser = null;
            
            // Fetch extra details from MySQL
            try {
                const res = await fetch(`/api/admin/roles/search?q=${currentUser.email}&requester=${currentUser.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    // Ensure we match the exact UID to be safe
                    dbUser = Array.isArray(data) ? data.find(u => u.firebaseUid === currentUser.uid) : null;
                    if(dbUser) setUserData(dbUser);
                } else {
                    console.warn("Failed to fetch user details:", res.status);
                }
            } catch (e) { 
                console.error("Auth sync error:", e); 
            }

            // Populate Form with DB data or fallback to Firebase data
            setFormData(prev => ({
                ...prev,
                full_name: dbUser?.fullName || currentUser.displayName || '',
                church_name: dbUser?.churchName || '', // Fetch Church Name from DB
                contact_number: '', 
                address: '' 
            }));
        }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Books
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/books?search=${search}&author=${selectedAuthor}`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books || []);
          setAuthors(['All', ...(data.authors || [])]);
        } else {
            console.error("Failed to fetch books:", res.status);
            setBooks([]);
        }
      } catch (e) {
        console.error("Book fetch error:", e);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timer);
  }, [search, selectedAuthor]);

  // --- HANDLERS ---

  const handleOrderClick = (book) => {
    if (!user) {
        if(confirm("You need to login to place an order. Go to login page?")) {
            router.push('/login');
        }
        return;
    }
    setSelectedBook(book);
    setOrderSuccess(false);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setIsOrdering(true);
    try {
        const res = await fetch('/api/public/book-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                book_id: selectedBook.id,
                user_uid: user.uid
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "Order failed");
        }
        
        setOrderSuccess(true);
        setTimeout(() => {
            setSelectedBook(null); // Close modal after 2s
            setOrderSuccess(false);
            setFormData(prev => ({ ...prev, quantity: 1, address: '', church_name: '' })); // Reset non-user fields
        }, 2500);

    } catch (error) {
        console.error("Order error:", error);
        alert("Something went wrong. Please check your connection and try again.");
    } finally {
        setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans ">
      <Navbar />
      
      {/* --- HERO HEADER --- */}

       <div className="relative h-[95vh] flex items-center justify-center bg-gray-900 overflow-hidden">
        {/* Abstract Background Animation */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-700 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/8 w-80 h-80 bg-gray-550 rounded-full mix-blend-multiply filter blur-2xl animate-pulse" style={{animationDelay: '20s'}}></div>
            <div className="absolute bottom-1/4 left-1/10 w-72 h-72 bg-gray-590 rounded-full mix-blend-multiply filter blur-2xl animate-pulse" style={{animationDelay: '8s'}}></div>
          </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4"
        >
          <span className="text-blue-400 font-bold tracking-widest uppercase mb-4 block inline-flex items-center gap-2  border border-blue-400 px-4 py-1.5 rounded-full text-xs"><BookOpen size={14} className="text-amber-400"/> Church Library & Store</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Discover Spiritual Wisdom</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Browse our collection of books, study guides, and resources. Order online and pick up at the church office.
            </p>
        </motion.div>
      </div>





      {/* --- SEARCH & FILTERS --- */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Author Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
                {authors.map((auth) => (
                    <button
                        key={auth}
                        onClick={() => setSelectedAuthor(auth)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border
                            ${selectedAuthor === auth 
                            ? 'bg-blue-900 text-white border-blue-900' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-blue-500 hover:text-blue-600'}
                        `}
                    >
                        {auth}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="Search by title..." 
                    className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 text-slate-900 pl-10 pr-4 py-2 rounded-lg outline-none transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
        </div>
      </div>

      {/* --- BOOK GRID --- */}
      <div className="max-w-7xl mx-auto px-4 mt-8 mb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
             <Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4"/>
             <p className="text-sm tracking-widest uppercase text-gray-500">Loading Library...</p>
          </div>
        ) : (
          <>
            {books.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {books.map((book) => (
                        <BookCard key={book.id} book={book} onOrder={handleOrderClick} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <BookOpen size={32}/>
                    </div>
                    <p className="text-gray-500 font-medium">No books found.</p>
                    <button onClick={() => {setSearch(''); setSelectedAuthor('All')}} className="mt-2 text-blue-600 hover:underline text-sm">Clear filters</button>
                </div>
            )}
          </>
        )}
      </div>

      {/* --- ORDER MODAL --- */}
      <AnimatePresence>
        {selectedBook && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => !isOrdering && setSelectedBook(null)}
            >
                <motion.div 
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="bg-blue-900 text-white p-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Place Order</h2>
                            <p className="text-blue-200 text-sm">{selectedBook.title}</p>
                        </div>
                        <button onClick={() => setSelectedBook(null)} className="p-1 hover:bg-white/20 rounded-full transition"><X size={20}/></button>
                    </div>

                    {/* Success State */}
                    {orderSuccess ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center h-64">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <CheckCircle size={32} strokeWidth={3}/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Order Received!</h3>
                            <p className="text-gray-500 text-sm">We will contact you shortly to confirm your order.</p>
                        </div>
                    ) : (
                        /* Form State */
                        <form onSubmit={handleOrderSubmit} className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                                        <div className="relative">
                                            <UserIcon size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                            <input required className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                            <input required type="tel" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                                value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} placeholder="07xxxxxxxx" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Church Name</label>
                                    <div className="relative">
                                        <Home size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                        <input required className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={formData.church_name} onChange={e => setFormData({...formData, church_name: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delivery Address</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                        <textarea required rows={2} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                                    <div className="flex items-center border w-32 rounded-lg overflow-hidden">
                                        <button type="button" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border-r" 
                                            onClick={() => setFormData(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))}>-</button>
                                        <input readOnly className="w-full text-center text-sm font-bold" value={formData.quantity} />
                                        <button type="button" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border-l" 
                                            onClick={() => setFormData(p => ({...p, quantity: p.quantity + 1}))}>+</button>
                                    </div>
                                </div>

                            </div>

                            <button disabled={isOrdering} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-6 transition shadow-lg flex items-center justify-center gap-2">
                                {isOrdering ? <Loader2 className="animate-spin"/> : <ShoppingBag size={18}/>}
                                {isOrdering ? 'Processing...' : 'Confirm Order'}
                            </button>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}