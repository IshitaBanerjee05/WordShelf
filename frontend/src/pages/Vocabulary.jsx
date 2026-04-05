import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, Volume2, BookmarkPlus, ChevronRight } from 'lucide-react';

const mockVocabulary = [];

export default function Vocabulary() {
  const [selectedWord, setSelectedWord] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col pb-8">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Vocabulary Ledger</h2>
          <p className="text-slate-500 mt-1 text-sm">Review, evaluate, and master your saved words.</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="group flex flex-col items-center justify-center p-3 w-40 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
            >
               <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 group-hover:animate-pulse" /> AI Extract</span>
               <span className="text-[10px] opacity-80 mt-0.5 text-center">Paste text & extract</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">
              <Plus className="w-5 h-5" />
              Manual Add
            </button>
        </div>
      </div>

      <AnimatePresence>
         {isAdding && (
           <motion.div 
             initial={{ opacity: 0, height: 0, marginBottom: 0 }}
             animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
             exit={{ opacity: 0, height: 0, marginBottom: 0 }}
             className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex-shrink-0 relative"
           >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                 <Sparkles className="text-emerald-500 w-5 h-5" /> Smart Vocabulary Extractor
              </h3>
              <div className="flex flex-col gap-4">
                 <textarea 
                   className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow min-h-[120px] resize-y shadow-inner"
                   placeholder="Paste an excerpt from an article or book chapter here. WordShelf NLP will automatically filter out common words and extract valuable vocabulary..."
                 ></textarea>
                 <div className="flex justify-end gap-3">
                    <button onClick={() => setIsAdding(false)} className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                    <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">Extract Words</button>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <div className="flex-1 min-h-0 flex gap-6 mt-2">
        {/* Word List Timeline */}
        <div className="w-1/3 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search saved words..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow shadow-sm" />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {mockVocabulary.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                <BookmarkPlus className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-sm font-medium text-center">No words saved yet.</p>
                <p className="text-xs mt-1 text-center px-4">Use "AI Extract" or "Manual Add" to start building your ledger.</p>
              </div>
            ) : (
              mockVocabulary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedWord(item)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selectedWord?.id === item.id 
                      ? 'bg-primary-50 border-primary-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold ${selectedWord?.id === item.id ? 'text-primary-700' : 'text-slate-800'}`}>{item.word}</span>
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${item.strength > 80 ? 'bg-emerald-500' : item.strength > 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500 gap-2">
                     <span className="italic">{item.pos}</span>
                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                     <span className="truncate">{item.meaning}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Word Detail Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-y-auto z-10 relative">
          {selectedWord ? (
            <div className="p-8">
               <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-serif">{selectedWord.word}</h1>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                      <span className="italic text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{selectedWord.pos}</span>
                      <button className="flex items-center gap-1.5 hover:text-slate-800 transition-colors p-1 rounded-md hover:bg-slate-100">
                        <Volume2 className="w-4 h-4" /> Listen
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm text-slate-400">
                     <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        Source: <span className="text-slate-700 font-medium">{selectedWord.source}</span>
                     </span>
                     <span>Added {selectedWord.addedAt}</span>
                  </div>
               </div>

               <div className="space-y-8">
                 <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Meaning</h3>
                    <p className="text-lg text-slate-800 leading-relaxed font-medium">{selectedWord.meaning}</p>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Translation (Hindi)</h3>
                    <p className="text-lg text-emerald-700 font-medium bg-emerald-50 inline-block px-3 py-1 rounded-lg">{selectedWord.translation}</p>
                 </section>

                 <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Example Context</h3>
                    <div className="space-y-3">
                      {selectedWord.examples.map((ex, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                           <p className="text-slate-700 italic border-l-2 border-transparent pl-2 font-serif">"{ex}"</p>
                        </div>
                      ))}
                    </div>
                 </section>

                 <section className="pt-6 border-t border-slate-100">
                     <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        AI Context Practice
                     </h3>
                     <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100/50">
                        <p className="text-sm text-amber-800 mb-3 font-medium">Write a sentence using exactly <strong className="font-bold text-amber-900 bg-amber-200/50 px-1 rounded">{selectedWord.word}</strong>. Our NLP will grade your usage.</p>
                        <textarea 
                           className="w-full bg-white border border-amber-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-shadow text-sm min-h-[80px]"
                           placeholder={`E.g., The beauty of the sunset was ${selectedWord.word.toLowerCase()}...`}
                        ></textarea>
                        <div className="mt-3 flex justify-end">
                           <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">Evaluate Usage</button>
                        </div>
                     </div>
                 </section>
               </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
               <BookmarkPlus className="w-16 h-16 opacity-20" />
               <p className="font-medium">Select a word to view details</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

