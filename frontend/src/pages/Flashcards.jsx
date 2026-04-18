import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Check, X, RotateCcw, Target, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(0);

  // Fetch due review items from backend
  useEffect(() => {
    const fetchDueCards = async () => {
      try {
        const res = await api.get('/vocabulary/review/due?limit=20');
        const mapped = res.data.map(v => ({
          id: v.id,
          front: v.word.charAt(0).toUpperCase() + v.word.slice(1),
          back: v.definition || 'No definition available',
          example: v.context_sentence || '',
          translation: '',
        }));
        setCards(mapped);
      } catch (err) {
        console.error('Failed to fetch flashcards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDueCards();
  }, []);

  const handleNext = async (correct) => {
    if (correct) setScore(s => s + 1);
    setIsFlipped(false);

    // Submit review to backend
    const activeCard = cards[currentIndex];
    if (activeCard) {
      try {
        await api.post(`/vocabulary/${activeCard.id}/review`, {
          quality: correct ? 4 : 2,
        });
      } catch (err) {
        console.error('Failed to submit review:', err);
      }
    }
    
    setTimeout(() => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setSessionComplete(true);
        }
    }, 150);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Loading flashcards…</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Brain className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">No Flashcards Due</h2>
          <p className="text-slate-500 font-medium">Add words to your Vocabulary Ledger to start a revision session. Words due for review will appear here.</p>
        </motion.div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <Target className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Session Complete!</h2>
          <p className="text-slate-500 font-medium mb-6">
            You got <span className="text-emerald-600 font-bold">{score}</span> out of <span className="font-bold">{cards.length}</span> correct.
          </p>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Review Again
          </button>
        </motion.div>
      </div>
    );
  }

  const activeCard = cards[currentIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col pt-8">
         <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                 <Brain className="w-6 h-6 text-primary-500" /> Daily Revision
              </h2>
              <p className="text-slate-500 text-sm mt-1">Spaced repetition session</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
               <span className="text-sm font-bold text-slate-700">{currentIndex + 1}</span>
               <span className="text-slate-400">/</span>
               <span className="text-sm font-medium text-slate-500">{cards.length}</span>
            </div>
         </div>

         <div className="h-2 w-full bg-slate-200 rounded-full mb-12 overflow-hidden shadow-inner">
             <motion.div 
               className="h-full bg-primary-500 rounded-full"
               initial={{ width: 0 }}
               animate={{ width: `${((currentIndex) / cards.length) * 100}%` }}
               transition={{ duration: 0.5 }}
             ></motion.div>
         </div>

         <div className="flex-1 relative flex items-center justify-center perspective-[1000px] mb-8">
            <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex + (isFlipped ? 'flip' : 'front')}
                  initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                  className="w-full max-w-2xl h-96 bg-white rounded-3xl shadow-xl border border-slate-100 p-12 flex flex-col justify-center items-center text-center cursor-pointer relative overflow-hidden group hover:shadow-2xl transition-shadow"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                   {/* Decorative background Elements */}
                   <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 rounded-full opacity-50"></div>
                   <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full opacity-50"></div>

                   {!isFlipped ? (
                      <div>
                         <span className="text-sm font-bold text-primary-500 tracking-widest uppercase mb-6 block drop-shadow-sm">Word</span>
                         <h3 className="text-6xl font-extrabold text-slate-900 font-serif tracking-tight drop-shadow-sm">{activeCard.front}</h3>
                         <p className="mt-8 text-slate-400 text-sm font-medium flex items-center gap-2 justify-center">
                            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-3 3m0 0l-3-3m3 3V8"></path></svg>
                            Click to reveal meaning
                         </p>
                      </div>
                   ) : (
                      <div className="w-full">
                         <span className="text-sm font-bold text-emerald-500 tracking-widest uppercase mb-4 block">Meaning</span>
                         <p className="text-2xl text-slate-800 font-medium leading-relaxed mb-6">"{activeCard.back}"</p>
                         {activeCard.example && (
                           <>
                             <div className="w-16 h-1 bg-slate-200 mx-auto my-6 rounded-full"></div>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                                <p className="text-slate-600 italic font-serif text-lg">"{activeCard.example}"</p>
                             </div>
                           </>
                         )}
                      </div>
                   )}
                </motion.div>
            </AnimatePresence>
         </div>

         {/* Control Buttons - visible only when flipped */}
         <AnimatePresence>
            {isFlipped && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="flex justify-center gap-6 pb-12"
               >
                  <button 
                     onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                     className="px-8 py-4 bg-white border-2 border-red-100 hover:border-red-300 hover:bg-red-50 text-red-600 rounded-2xl font-bold flex flex-col items-center gap-1 shadow-sm transition-all hover:-translate-y-1 w-48"
                  >
                     <X className="w-8 h-8" />
                     Have to review
                  </button>
                  <button 
                     onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                     className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex flex-col items-center gap-1 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1 w-48"
                  >
                     <Check className="w-8 h-8" />
                     Got it right
                  </button>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
