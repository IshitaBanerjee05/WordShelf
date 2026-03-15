import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, BrainCircuit, ChevronRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 text-black py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
           <BookOpen className="w-8 h-8 text-blue-600" />
           <span className="text-2xl font-bold tracking-tight text-slate-900">WordShelf</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</Link>
          <Link to="/dashboard" className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">Go to App</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>The intelligent vocabulary builder for serious readers.</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8"
        >
          Never read passively <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">ever again.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          WordShelf extracts vocabulary from your reading, builds intelligent flashcards, and helps you master nuances with AI-driven context analysis.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4"
        >
           <Link to="/dashboard" className="group flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
             Start Learning Now
             <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
           </Link>
        </motion.div>

        {/* Mockup Image */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-24 relative mx-auto max-w-5xl rounded-2xl border border-slate-200/50 bg-white/50 p-2 shadow-2xl backdrop-blur-sm"
        >
           <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden aspect-[16/9] flex items-center justify-center bg-slate-50 pb-0">
               {/* Abstract dashboard placeholder */}
               <div className="w-full h-full border-x border-t border-slate-200 rounded-t-lg bg-white shadow-sm flex flex-col overflow-hidden">
                   <div className="h-12 border-b border-slate-100 flex items-center px-6">
                       <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
                   </div>
                   <div className="flex-1 flex bg-slate-50/50">
                       <div className="w-64 border-r border-slate-100 bg-white p-6 space-y-4">
                           <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                           <div className="h-6 w-1/2 bg-slate-100 rounded"></div>
                           <div className="h-6 w-2/3 bg-slate-100 rounded"></div>
                       </div>
                       <div className="flex-1 p-8">
                            <div className="flex gap-6 mb-8">
                               <div className="h-32 flex-1 bg-white border border-slate-100 rounded-xl shadow-sm p-6 flex flex-col justify-between"><div className="h-4 w-1/2 bg-slate-100 rounded"></div><div className="h-8 w-1/3 bg-blue-100 rounded"></div></div>
                               <div className="h-32 flex-1 bg-white border border-slate-100 rounded-xl shadow-sm p-6 flex flex-col justify-between"><div className="h-4 w-1/2 bg-slate-100 rounded"></div><div className="h-8 w-1/3 bg-emerald-100 rounded"></div></div>
                               <div className="h-32 flex-1 bg-white border border-slate-100 rounded-xl shadow-sm p-6 flex flex-col justify-between"><div className="h-4 w-1/2 bg-slate-100 rounded"></div><div className="h-8 w-1/3 bg-amber-100 rounded"></div></div>
                            </div>
                            <div className="h-64 bg-white border border-slate-100 rounded-xl shadow-sm p-6"><div className="h-full w-full bg-slate-50 rounded border border-slate-100 flex items-end px-4 gap-4 pt-12 pb-4"> {[...Array(12)].map((_, i) => <div key={i} className="w-full bg-blue-100 rounded-t-md" style={{height: `${Math.random() * 80 + 20}%`}}></div>)}</div></div>
                       </div>
                   </div>
               </div>
           </div>
        </motion.div>
      </main>
    </div>
  )
}
