import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, BookOpen, MoreVertical, X,
  Loader2, AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import api from '../utils/api';

// ─── Open Library helpers ──────────────────────────────────────────────────────

const COVER_BASE = 'https://covers.openlibrary.org/b/id';

function coverUrl(coverId, size = 'M') {
  return coverId ? `${COVER_BASE}/${coverId}-${size}.jpg` : null;
}

// Map backend book → frontend card format
function mapBackendBook(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.author || 'Unknown Author',
    year: null,
    cover: null,
    coverId: null,
    status: b.status === 'to_read' ? 'Planned' : b.status === 'reading' ? 'Reading' : 'Completed',
    progress: b.total_pages ? Math.round((b.current_page / b.total_pages) * 100) : 0,
    wordsLearned: 0,
    olKey: null,
    backendId: b.id,
  };
}

// Map frontend status → backend status
function mapStatus(frontendStatus) {
  switch (frontendStatus) {
    case 'Reading': return 'reading';
    case 'Completed': return 'completed';
    case 'Planned': default: return 'to_read';
  }
}

// ─── AddResourcePanel ──────────────────────────────────────────────────────────

const STATUS_OPTS = ['Reading', 'Planned', 'Completed'];

const STATUS_COLORS = {
  Reading: 'bg-amber-500',
  Completed: 'bg-emerald-500',
  Planned: 'bg-slate-500',
};

function AddResourcePanel({ onClose, onAddBook }) {
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [results, setResults]   = useState([]);
  const [selected, setSelected] = useState(null); // chosen search result
  const [status, setStatus]     = useState('Reading');
  const [added, setAdded]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Reset selection when a new search is triggered
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(null);
    setAdded(false);

    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,cover_i,first_publish_year,edition_count&limit=8`
      );
      if (!res.ok) throw new Error('Search failed. Please try again.');
      const json = await res.json();
      if (!json.docs?.length) throw new Error(`No results found for "${q}".`);
      setResults(json.docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selected || added || saving) return;
    setSaving(true);
    setError(null);

    try {
      const bookPayload = {
        title: selected.title,
        author: selected.author_name?.[0] ?? 'Unknown Author',
        total_pages: 0,
        current_page: 0,
        status: mapStatus(status),
        language: 'en',
      };
      const res = await api.post('/bookshelf/', bookPayload);
      
      // Build frontend entry from backend response
      const entry = {
        id: res.data.id,
        title: res.data.title,
        author: res.data.author || 'Unknown',
        year: selected.first_publish_year ?? null,
        cover: coverUrl(selected.cover_i, 'L'),
        coverId: selected.cover_i ?? null,
        status,
        progress: status === 'Completed' ? 100 : 0,
        wordsLearned: 0,
        olKey: selected.key,
        backendId: res.data.id,
      };
      onAddBook(entry);
      setAdded(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save book. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8 relative"
    >
      {/* top accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-emerald-500" />

      <div className="p-6">
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-600" />
            Add a Book or Resource
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* search form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-primary-500/25"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* results grid */}
        <AnimatePresence>
          {results.length > 0 && !selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                Search Results — click to select
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {results.map((book, i) => (
                  <motion.button
                    key={book.key ?? i}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setSelected(book); setAdded(false); }}
                    className="group text-left rounded-xl border border-slate-200 overflow-hidden hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    {/* cover */}
                    <div className="aspect-[2/3] bg-slate-100 overflow-hidden">
                      {coverUrl(book.cover_i) ? (
                        <img
                          src={coverUrl(book.cover_i)}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <BookOpen className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-0.5">
                        {book.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {book.author_name?.[0] ?? '—'}
                      </p>
                      {book.first_publish_year && (
                        <p className="text-[10px] text-slate-400">{book.first_publish_year}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* selected book detail + add controls */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200"
            >
              {/* cover thumbnail */}
              <div className="w-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm aspect-[2/3]">
                {coverUrl(selected.cover_i) ? (
                  <img src={coverUrl(selected.cover_i, 'M')} alt={selected.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>

              {/* info + controls */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-base mb-0.5 leading-snug">{selected.title}</h4>
                <p className="text-sm text-slate-500 mb-1">{selected.author_name?.[0] ?? 'Unknown Author'}</p>
                {selected.first_publish_year && (
                  <p className="text-xs text-slate-400 mb-4">First published {selected.first_publish_year}</p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {/* status picker */}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      disabled={added}
                      className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none cursor-pointer hover:border-slate-300 transition-colors disabled:opacity-50"
                    >
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>

                  {/* add button */}
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={added || saving}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      added
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/25'
                    }`}
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : added ? (
                      <><CheckCircle2 className="w-4 h-4" /> Added to Shelf</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Add to Shelf</>
                    )}
                  </button>

                  {/* back to results */}
                  {!added && !saving && (
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
                    >
                      ← Back to results
                    </button>
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

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] ?? 'bg-slate-400';
  return (
    <span className={`px-2 py-1 text-xs font-bold ${cls} text-white rounded-full shadow-sm`}>
      {status}
    </span>
  );
}

// ─── Book card ─────────────────────────────────────────────────────────────────

function BookCard({ book, idx }) {
  const hasCover = !!book.cover;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(idx * 0.07, 0.5) }}
      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300"
    >
      {/* cover */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        {hasCover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-10 h-10 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium px-4 text-center line-clamp-2">{book.title}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />

        {/* status badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <StatusBadge status={book.status} />
        </div>

        {/* words + progress */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-end justify-between text-white drop-shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <BookOpen className="w-4 h-4" />
              {book.wordsLearned} Words
            </div>
            <span className="text-xs font-bold">{book.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/30 rounded-full mt-2 overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-primary-400 rounded-full" style={{ width: `${book.progress}%` }} />
          </div>
        </div>
      </div>

      {/* info */}
      <div className="p-5">
        <h3 className="font-bold text-slate-800 text-base line-clamp-1 mb-0.5 group-hover:text-primary-600 transition-colors">
          {book.title}
        </h3>
        <p className="text-sm font-medium text-slate-500 truncate">{book.author}</p>
        {book.year && <p className="text-xs text-slate-400 mt-0.5">{book.year}</p>}
      </div>
    </motion.div>
  );
}

// ─── Main Bookshelf page ───────────────────────────────────────────────────────

const TABS = ['All', 'Reading', 'Completed', 'Planned'];

export default function Bookshelf() {
  const [books, setBooks]           = useState([]);
  const [activeTab, setActiveTab]   = useState('All');
  const [searchQ, setSearchQ]       = useState('');
  const [isAdding, setIsAdding]     = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Fetch books from backend on mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/bookshelf/');
        const mapped = res.data.map(mapBackendBook);
        setBooks(mapped);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, []);

  const handleAddBook = (entry) => {
    setBooks(prev => {
      const isDupe = prev.some(b => b.backendId === entry.backendId);
      if (isDupe) return prev;
      return [entry, ...prev];
    });
  };

  // filter by tab + search
  const visible = books
    .filter(b => activeTab === 'All' || b.status === activeTab)
    .filter(b =>
      b.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQ.toLowerCase())
    );

  const isEmpty = visible.length === 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Digital Bookshelf</h2>
          <p className="text-slate-500 mt-1 text-sm">Organize your reading and track extracted vocabulary.</p>
        </div>
        <button
          onClick={() => setIsAdding(v => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 ${
            isAdding
              ? 'bg-slate-700 text-white shadow-slate-700/30'
              : 'bg-primary-600 text-white shadow-primary-500/30 hover:bg-primary-700'
          }`}
        >
          <Plus className="w-5 h-5" />
          {isAdding ? 'Close' : 'Add Resource'}
        </button>
      </div>

      {/* Add panel */}
      <AnimatePresence>
        {isAdding && (
          <AddResourcePanel
            onClose={() => setIsAdding(false)}
            onAddBook={(entry) => { handleAddBook(entry); }}
          />
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex-1 md:flex-none text-center ${
                activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                  {books.filter(b => b.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search your shelf…"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loadingBooks ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium text-sm">Loading your bookshelf…</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen className="w-16 h-16 opacity-20 mb-4" />
          <p className="font-semibold text-base">
            {books.length === 0
              ? 'Your bookshelf is empty.'
              : activeTab !== 'All'
                ? `No books marked as "${activeTab}".`
                : 'No books match your search.'}
          </p>
          <p className="text-sm mt-1">
            {books.length === 0
              ? 'Click "Add Resource" to add your first book.'
              : 'Try a different filter or search term.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visible.map((book, idx) => (
            <BookCard key={book.id} book={book} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
