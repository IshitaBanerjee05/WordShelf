import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, BookOpen, MoreVertical, Filter, Star } from 'lucide-react';

const mockBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', progress: 100, status: 'Completed', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', wordsLearned: 45 },
  { id: 2, title: 'Atomic Habits', author: 'James Clear', progress: 65, status: 'Reading', cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', wordsLearned: 12 },
  { id: 3, title: 'Sapiens', author: 'Yuval Noah Harari', progress: 15, status: 'Reading', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400', wordsLearned: 105 },
  { id: 4, title: 'Dune', author: 'Frank Herbert', progress: 0, status: 'Planned', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400', wordsLearned: 0 },
];

export default function Bookshelf() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Digital Bookshelf</h2>
          <p className="text-slate-500 mt-1 text-sm">Organize your reading and track extracted vocabulary.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {['All', 'Reading', 'Completed', 'Planned'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex-1 md:flex-none text-center ${
                activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Search resources..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
          </div>
          <button className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockBooks.map((book, idx) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300"
          >
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
               <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
               <div className="absolute top-3 right-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm p-1.5 rounded-full cursor-pointer transition-colors">
                 <MoreVertical className="w-4 h-4" />
               </div>
               
               <div className="absolute top-3 left-3 flex gap-1.5">
                 {book.status === 'Reading' && <span className="px-2 py-1 text-xs font-bold bg-amber-500 text-white rounded-full shadow-sm backdrop-blur-md bg-opacity-90">Reading</span>}
                 {book.status === 'Completed' && <span className="px-2 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full shadow-sm backdrop-blur-md bg-opacity-90">Completed</span>}
                 {book.status === 'Planned' && <span className="px-2 py-1 text-xs font-bold bg-slate-500 text-white rounded-full shadow-sm backdrop-blur-md bg-opacity-90">Planned</span>}
               </div>

               <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-end justify-between text-white drop-shadow-md">
                     <div className="flex items-center gap-1.5 text-xs font-medium">
                       <BookOpen className="w-4 h-4" />
                       {book.wordsLearned} Words
                     </div>
                     <span className="text-xs font-bold">{book.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/30 rounded-full mt-2 overflow-hidden backdrop-blur-sm">
                    <div className="h-full bg-primary-400 rounded-full" style={{ width: `${book.progress}%` }}></div>
                  </div>
               </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-slate-800 text-lg line-clamp-1 mb-1 group-hover:text-primary-600 transition-colors">{book.title}</h3>
              <p className="text-sm font-medium text-slate-500">{book.author}</p>
            </div>
            
            <button className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 z-10 opacity-0 group-hover:opacity-100">
               <span className="sr-only">View Book</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

