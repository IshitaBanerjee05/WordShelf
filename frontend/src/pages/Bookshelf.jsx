import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, X, Loader2, AlertCircle, CheckCircle2, ChevronDown, Trash2, Edit3, Check } from 'lucide-react';
import api from '../utils/api';

const COVER_BASE = 'https://covers.openlibrary.org/b/id';
function coverUrl(coverId, size = 'M') {
  return coverId ? `${COVER_BASE}/${coverId}-${size}.jpg` : null;
}

function mapBackendBook(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.author || 'Unknown Author',
    cover: b.cover_url || null,
    status: b.status === 'to_read' ? 'Planned' : b.status === 'reading' ? 'Reading' : 'Completed',
    total_pages: b.total_pages || 0,
    current_page: b.current_page || 0,
    progress: b.total_pages ? Math.round((b.current_page / b.total_pages) * 100) : 0,
    backendId: b.id,
  };
}

function mapStatus(s) {
  return s === 'Reading' ? 'reading' : s === 'Completed' ? 'completed' : 'to_read';
}

const STATUS_OPTS = ['Reading', 'Planned', 'Completed'];
const STATUS_COLORS = { Reading: 'bg-amber-500', Completed: 'bg-emerald-500', Planned: 'bg-slate-500' };

// ── Add Panel ──────────────────────────────────────────────────────────────────
function AddResourcePanel({ onClose, onAddBook }) {
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus]   = useState('Reading');
  const [added, setAdded]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError(null); setResults([]); setSelected(null); setAdded(false);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,cover_i,first_publish_year&limit=8`);
      if (!res.ok) throw new Error('Search failed.');
      const json = await res.json();
      if (!json.docs?.length) throw new Error(`No results for "${q}".`);
      setResults(json.docs);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!selected || added || saving) return;
    setSaving(true); setError(null);
    try {
      const builtCoverUrl = selected.cover_i ? `${COVER_BASE}/${selected.cover_i}-L.jpg` : null;
      const payload = {
        title: selected.title,
        author: selected.author_name?.[0] ?? 'Unknown Author',
        total_pages: 0, current_page: 0,
        status: mapStatus(status), language: 'en',
        cover_url: builtCoverUrl,
      };
      const res = await api.post('/bookshelf/', payload);
      onAddBook({
        id: res.data.id, title: res.data.title,
        author: res.data.author || 'Unknown',
        cover: builtCoverUrl, status,
        total_pages: 0, current_page: 0, progress: 0,
        backendId: res.data.id,
      });
      setAdded(true);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8 relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-emerald-500" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-primary-600" />Add a Book</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by title, author…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm" />
          </div>
          <button type="submit" disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-40 flex items-center gap-2 shadow-md shadow-primary-500/25">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {results.length > 0 && !selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Results — click to select</p>
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 max-h-64 overflow-y-auto pr-1">
                {results.map((book, i) => (
                  <button key={book.key ?? i} type="button" onClick={() => { setSelected(book); setAdded(false); }}
                    className="group text-left rounded-xl border border-slate-200 overflow-hidden hover:border-primary-400 hover:shadow-md transition-all">
                    <div className="aspect-[2/3] bg-slate-100 overflow-hidden">
                      {coverUrl(book.cover_i)
                        ? <img src={coverUrl(book.cover_i)} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"><BookOpen className="w-6 h-6 text-slate-300" /></div>}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-0.5">{book.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{book.author_name?.[0] ?? '—'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm aspect-[2/3]">
                {coverUrl(selected.cover_i)
                  ? <img src={coverUrl(selected.cover_i, 'M')} alt={selected.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"><BookOpen className="w-5 h-5 text-slate-300" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-base mb-0.5">{selected.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{selected.author_name?.[0] ?? 'Unknown'}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <select value={status} onChange={e => setStatus(e.target.value)} disabled={added}
                      className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none cursor-pointer disabled:opacity-50">
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <button type="button" onClick={handleAdd} disabled={added || saving}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all ${added ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/25'}`}>
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                     : added ? <><CheckCircle2 className="w-4 h-4" />Added!</>
                     : <><Plus className="w-4 h-4" />Add to Shelf</>}
                  </button>
                  {!added && !saving && (
                    <button type="button" onClick={() => setSelected(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline">← Back</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Book Card ──────────────────────────────────────────────────────────────────
function BookCard({ book, onDelete, onUpdate }) {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [editStatus, setEditStatus]   = useState(false);
  const [editProgress, setEditProgress] = useState(false);
  const [statusVal, setStatusVal]     = useState(book.status);
  const [currPage, setCurrPage]       = useState(book.current_page);
  const [totalPage, setTotalPage]     = useState(book.total_pages);
  const [saving, setSaving]           = useState(false);

  const saveStatus = async (newStatus) => {
    setStatusVal(newStatus); setEditStatus(false);
    setSaving(true);
    try {
      const res = await api.put(`/bookshelf/${book.id}`, { status: mapStatus(newStatus) });
      onUpdate({ ...book, status: newStatus });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const saveProgress = async () => {
    setEditProgress(false);
    const cp = Math.min(parseInt(currPage) || 0, parseInt(totalPage) || 0);
    const tp = parseInt(totalPage) || 0;
    setSaving(true);
    try {
      await api.put(`/bookshelf/${book.id}`, { current_page: cp, total_pages: tp });
      onUpdate({ ...book, current_page: cp, total_pages: tp, progress: tp ? Math.round((cp / tp) * 100) : 0 });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const progress = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : book.progress || 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300">

      {/* Cover */}
      <div className="aspect-[2/3] bg-slate-100 relative overflow-hidden">
        {book.cover
          ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
          : <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex flex-col items-center justify-center gap-2">
              <BookOpen className="w-12 h-12 text-slate-400" />
              <p className="text-xs text-slate-400 font-medium px-4 text-center line-clamp-3">{book.title}</p>
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-bold ${STATUS_COLORS[book.status] ?? 'bg-slate-400'} text-white rounded-full shadow-sm`}>
            {book.status}
          </span>
        </div>

        {/* 3-dot menu */}
        <div className="absolute top-3 right-3">
          <button onClick={() => setMenuOpen(v => !v)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all backdrop-blur-sm">
            <span className="text-white text-xs font-bold leading-none">⋯</span>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-40 z-20">
                <button onClick={() => { setEditStatus(true); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Change Status
                </button>
                <button onClick={() => { setEditProgress(true); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Update Progress
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={() => { onDelete(book.id); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Remove Book
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-end justify-between text-white drop-shadow-md mb-1">
            <span className="text-xs font-medium">{book.current_page}/{book.total_pages || '?'} pages</span>
            <span className="text-xs font-bold">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-primary-400 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-slate-800 text-base line-clamp-1 mb-0.5 group-hover:text-primary-600 transition-colors">{book.title}</h3>
        <p className="text-sm font-medium text-slate-500 truncate">{book.author}</p>
      </div>

      {/* Status editor inline */}
      <AnimatePresence>
        {editStatus && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 z-10">
            <p className="text-sm font-bold text-slate-700 mb-1">Change Status</p>
            {STATUS_OPTS.map(s => (
              <button key={s} onClick={() => saveStatus(s)}
                className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${statusVal === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {s}
              </button>
            ))}
            <button onClick={() => setEditStatus(false)} className="text-xs text-slate-400 hover:text-slate-600 mt-1">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress editor inline */}
      <AnimatePresence>
        {editProgress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 z-10">
            <p className="text-sm font-bold text-slate-700 mb-1">Update Reading Progress</p>
            <div className="w-full space-y-2">
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide block mb-1">Current Page</label>
                <input type="number" min="0" value={currPage} onChange={e => setCurrPage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide block mb-1">Total Pages</label>
                <input type="number" min="0" value={totalPage} onChange={e => setTotalPage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={saveProgress}
                className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 flex items-center justify-center gap-1">
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setEditProgress(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const TABS = ['All', 'Reading', 'Completed', 'Planned'];

export default function Bookshelf() {
  const [books, setBooks]           = useState([]);
  const [activeTab, setActiveTab]   = useState('All');
  const [searchQ, setSearchQ]       = useState('');
  const [isAdding, setIsAdding]     = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/bookshelf/');
        setBooks(res.data.map(mapBackendBook));
      } catch (err) { console.error(err); }
      finally { setLoadingBooks(false); }
    };
    fetchBooks();
  }, []);

  const handleAddBook = (entry) => {
    setBooks(prev => prev.some(b => b.backendId === entry.backendId) ? prev : [entry, ...prev]);
  };

  const handleDelete = async (bookId) => {
    try {
      await api.delete(`/bookshelf/${bookId}`);
      setBooks(prev => prev.filter(b => b.id !== bookId));
    } catch (err) { console.error(err); }
  };

  const handleUpdate = (updated) => {
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const visible = books
    .filter(b => activeTab === 'All' || b.status === activeTab)
    .filter(b => b.title.toLowerCase().includes(searchQ.toLowerCase()) || b.author.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Digital Bookshelf</h2>
          <p className="text-slate-500 mt-1 text-sm">Organize your reading and track vocabulary.</p>
        </div>
        <button onClick={() => setIsAdding(v => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 ${isAdding ? 'bg-slate-700 text-white shadow-slate-700/30' : 'bg-primary-600 text-white shadow-primary-500/30 hover:bg-primary-700'}`}>
          <Plus className="w-5 h-5" />{isAdding ? 'Close' : 'Add Resource'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && <AddResourcePanel onClose={() => setIsAdding(false)} onAddBook={(e) => { handleAddBook(e); }} />}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex-1 md:flex-none text-center ${activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab}
              {tab !== 'All' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                  {books.filter(b => b.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search your shelf…"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {loadingBooks ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium text-sm">Loading your bookshelf…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen className="w-16 h-16 opacity-20 mb-4" />
          <p className="font-semibold text-base">
            {books.length === 0 ? 'Your bookshelf is empty.' : activeTab !== 'All' ? `No books marked as "${activeTab}".` : 'No books match your search.'}
          </p>
          <p className="text-sm mt-1">{books.length === 0 ? 'Click "Add Resource" to add your first book.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visible.map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
