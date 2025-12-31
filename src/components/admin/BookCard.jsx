"use client";
import { Book, ShoppingCart, Ban } from 'lucide-react';

export default function BookCard({ book, onOrder }) {
  if (!book) return null;

  const isOutOfStock = book.stock_status === 'out_of_stock';

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
      {/* Cover Image */}
      <div className="aspect-[2/3] w-full bg-gray-100 relative overflow-hidden">
        {book.image_url ? (
          <img 
            src={book.image_url} 
            alt={book.title} 
            className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-70' : 'group-hover:scale-105'}`} 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Book size={48} />
            <span className="text-xs mt-2 uppercase tracking-widest">No Cover</span>
          </div>
        )}
        
        {/* Stock Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm
            ${book.stock_status === 'in_stock' ? 'bg-green-100 text-green-700 border-green-200' : 
              book.stock_status === 'pre_order' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {book.stock_status?.replace('_', ' ')}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-slate-900 font-bold text-lg leading-tight mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-slate-500 mb-3 font-medium">by {book.author}</p>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow font-light">
          {book.description}
        </p>

        {/* Footer / Action */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
           <div className="text-xs text-gray-400 font-semibold">
              {book.pages ? `${book.pages} Pages` : ''} 
              {book.pages && book.publish_year ? ' • ' : ''}
              {book.publish_year}
           </div>
           
           {isOutOfStock ? (
             <button 
               disabled
               className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-not-allowed border border-gray-200"
             >
               <Ban size={16}/> Sold Out
             </button>
           ) : (
             <button 
               onClick={() => onOrder(book)}
               className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg transform active:scale-95"
             >
               <ShoppingCart size={16}/> Order
             </button>
           )}
        </div>
      </div>
    </div>
  );
}