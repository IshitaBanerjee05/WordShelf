import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Sparkles, Volume2, BookmarkPlus,
  X, Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Languages, Trash2,
  SendHorizonal, Star, RotateCcw
} from 'lucide-react';
import api from '../utils/api';

// ─── Language options ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'it', label: 'Italian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ur', label: 'Urdu' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildWordEntry(apiData, chosenDef, backendId = null) {
  const word = apiData[0].word;
  const phonetics = apiData[0].phonetics ?? [];
  const audioUrl = phonetics.find(p => p.audio)?.audio ?? null;

  return {
    id: backendId || Date.now(),
    backendId,
    word: word.charAt(0).toUpperCase() + word.slice(1),
    pos: chosenDef.partOfSpeech,
    meaning: chosenDef.definition,
    examples: chosenDef.example ? [chosenDef.example] : [],
    synonyms: chosenDef.synonyms ?? [],
    antonyms: chosenDef.antonyms ?? [],
    phonetic: apiData[0].phonetic ?? phonetics[0]?.text ?? '',
    audioUrl,
    source: 'Manual — Dictionary',
    addedAt: 'Just now',
    strength: 0,
  };
}

// Map backend vocabulary → frontend word entry
function mapBackendVocab(v) {
  return {
    id: v.id,
    backendId: v.id,
    word: v.word.charAt(0).toUpperCase() + v.word.slice(1),
    pos: '',
    meaning: v.definition || '',
    examples: v.context_sentence ? [v.context_sentence] : [],
    synonyms: [],
    antonyms: [],
    phonetic: '',
    audioUrl: null,
    source: 'Saved',
    addedAt: new Date(v.created_at).toLocaleDateString(),
    strength: v.learning_status === 'mastered' ? 100 : v.learning_status === 'learning' ? 50 : 0,
    learningStatus: v.learning_status,
    nextReviewDate: v.next_review_date,
  };
}

// flatten all definitions out of the raw API response
function extractDefs(apiData) {
  const defs = [];
  for (const entry of apiData) {
    for (const meaning of entry.meanings ?? []) {
      for (const def of meaning.definitions ?? []) {
        defs.push({
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example ?? null,
          synonyms: def.synonyms ?? [],
          antonyms: def.antonyms ?? [],
        });
      }
    }
  }
  return defs;
}

// ─── ManualAddPanel ────────────────────────────────────────────────────────────

function ManualAddPanel({ onClose, onAddWord }) {
  const [query, setQuery]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [apiData, setApiData]           = useState(null);   // raw API response
  const [defs, setDefs]                 = useState([]);     // flattened definitions
  const [expandedIdx, setExpandedIdx]   = useState(null);
  const [wordAdded, setWordAdded]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const word = query.trim();
    if (!word) return;

    setLoading(true);
    setError(null);
    setApiData(null);
    setDefs([]);
    setExpandedIdx(null);
    setWordAdded(false);

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );
      if (!res.ok) {
        if (res.status === 404) throw new Error(`"${word}" was not found in the dictionary.`);
        throw new Error('Something went wrong. Please try again.');
      }
      const data = await res.json();
      setApiData(data);
      setDefs(extractDefs(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (idx) => {
    if (wordAdded || saving) return;
    setSaving(true);
    setError(null);

    try {
      const chosenDef = defs[idx];
      // Persist to backend
      const payload = {
        word: apiData[0].word,
        definition: chosenDef.definition,
        context_sentence: chosenDef.example || null,
        language: 'en',
        learning_status: 'new',
      };
      const res = await api.post('/vocabulary/', payload);

      const entry = buildWordEntry(apiData, chosenDef, res.data.id);
      entry.backendId = res.data.id;
      onAddWord(entry);
      setWordAdded(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save word. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // group defs by part-of-speech for display
  const grouped = defs.reduce((acc, def, idx) => {
    const key = def.partOfSpeech;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...def, idx });
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0 relative"
    >
      {/* decorative accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-700 to-slate-500" />

      <div className="p-6">
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-slate-600" />
            Add Word Manually
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a word to look up…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-slate-900/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* results */}
        <AnimatePresence>
          {apiData && defs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar"
            >
              {/* word header */}
              <div className="flex items-baseline gap-3 pb-3 border-b border-slate-100">
                <span className="text-2xl font-extrabold text-slate-900 font-serif capitalize">
                  {apiData[0].word}
                </span>
                {apiData[0].phonetic && (
                  <span className="text-sm text-slate-500 font-mono">{apiData[0].phonetic}</span>
                )}
                {apiData[0].phonetics?.find(p => p.audio) && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = apiData[0].phonetics.find(p => p.audio)?.audio;
                      if (url) new Audio(url).play();
                    }}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                )}
              </div>

              {/* definitions grouped by pos */}
              {Object.entries(grouped).map(([pos, entries]) => (
                <div key={pos}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 italic">
                    {pos}
                  </p>
                  <div className="space-y-2">
                    {entries.map(({ idx, definition, example, synonyms }) => {
                      const isExpanded = expandedIdx === idx;
                      const isAdded = wordAdded;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border transition-all ${
                            isAdded
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* definition row */}
                          <button
                            type="button"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                            className="w-full text-left p-3.5 flex items-start justify-between gap-3"
                          >
                            <p className="text-sm text-slate-700 leading-relaxed flex-1">
                              {definition}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                              {isAdded && (
                                <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Added
                                </span>
                              )}
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                : <ChevronDown className="w-4 h-4 text-slate-400" />
                              }
                            </div>
                          </button>

                          {/* expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-200/70 pt-3">
                                  {example && (
                                    <p className="text-xs text-slate-500 italic font-serif">
                                      "{example}"
                                    </p>
                                  )}
                                  {synonyms.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="text-xs text-slate-400 font-semibold mr-1">Synonyms:</span>
                                      {synonyms.slice(0, 6).map(s => (
                                        <span key={s} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full border border-primary-100">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleAdd(idx)}
                                      disabled={isAdded || saving}
                                      className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        isAdded
                                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                          : 'bg-slate-900 text-white hover:bg-slate-700 shadow-sm'
                                      }`}
                                    >
                                      {saving ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                                      ) : isAdded ? (
                                        <><CheckCircle2 className="w-3.5 h-3.5" /> Added to Ledger</>
                                      ) : (
                                        <><Plus className="w-3.5 h-3.5" /> Add to Ledger</>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
// ─── AiExtractPanel ────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  rare:     { badge: 'bg-red-100 text-red-700 border-red-200',     dot: 'bg-red-400',     label: '🔴 Rare' },
  uncommon: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: '🟡 Uncommon' },
  advanced: { badge: 'bg-blue-100 text-blue-700 border-blue-200',  dot: 'bg-blue-400',    label: '🔵 Advanced' },
  common:   { badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300', label: '⚪ Common' },
};

function AiExtractPanel({ onClose, onAddWord }) {
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [words, setWords]         = useState([]);   // ExtractedWord[]
  const [added, setAdded]         = useState({});   // { word: bool }
  const [saving, setSaving]       = useState({});

  const handleExtract = async () => {
    const t = text.trim();
    if (!t) return;
    setLoading(true); setError(null); setWords([]); setAdded({}); setSaving({});
    try {
      const res = await api.post('/vocabulary/extract-from-text', { text: t, max_words: 12 });
      if (res.data.length === 0) {
        setError('No hard words found in this passage. Try a more literary or academic text.');
      } else {
        setWords(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Extraction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (w) => {
    if (added[w.word] || saving[w.word]) return;
    setSaving(prev => ({ ...prev, [w.word]: true }));
    try {
      const payload = {
        word: w.word, definition: w.definition || '', language: 'en',
        context_sentence: w.example || null, learning_status: 'new',
      };
      const res = await api.post('/vocabulary/', payload);
      onAddWord({
        id: res.data.id, backendId: res.data.id,
        word: w.word.charAt(0).toUpperCase() + w.word.slice(1),
        pos: w.pos, meaning: w.definition || '',
        examples: w.example ? [w.example] : [],
        synonyms: [], antonyms: [], phonetic: '', audioUrl: null,
        source: 'AI Extract', addedAt: 'Just now', strength: 0,
        learningStatus: 'new',
      });
      setAdded(prev => ({ ...prev, [w.word]: true }));
    } catch (err) {
      console.error('Failed to save word:', err);
    } finally {
      setSaving(prev => ({ ...prev, [w.word]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
          <Sparkles className="text-emerald-500 w-5 h-5" /> Smart Vocabulary Extractor
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal ml-1">Basic Mode</span>
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex gap-3 mb-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow min-h-[110px] resize-none shadow-inner text-sm"
          placeholder="Paste a passage from a book, article, or essay. The NLP engine will score each word by rarity and return the hardest ones…"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end gap-3 mb-5">
        <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800">Cancel</button>
        <button onClick={handleExtract} disabled={loading || !text.trim()}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-40 flex items-center gap-2 transition-all">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Extracting…</> : <><Sparkles className="w-4 h-4" />Extract Words</>}
        </button>
      </div>

      <AnimatePresence>
        {words.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {words.length} words found — sorted hardest first
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {words.map((w) => {
                const style = DIFFICULTY_STYLES[w.difficulty_label] ?? DIFFICULTY_STYLES.advanced;
                const isAdded = added[w.word];
                const isSaving = saving[w.word];
                return (
                  <motion.div key={w.word} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${isAdded ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-800 capitalize text-sm">{w.word}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${style.badge}`}>
                        {w.difficulty_label}
                      </span>
                    </div>
                    {w.definition && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{w.definition}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-[10px] text-slate-400 italic">{w.pos}</span>
                      <button onClick={() => handleAdd(w)} disabled={isAdded || isSaving}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${isAdded ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" />
                         : isAdded ? <><CheckCircle2 className="w-3 h-3" />Added</>
                         : <><Plus className="w-3 h-3" />Add</>}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PracticeSection ───────────────────────────────────────────────────────────

function PracticeSection({ word }) {
  const [sentence, setSentence]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  // Reset when the selected word changes
  React.useEffect(() => { setSentence(''); setResult(null); setError(null); }, [word?.id]);

  const handleEvaluate = async () => {
    if (!sentence.trim() || !word?.backendId) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api.post('/vocabulary/evaluate-usage', {
        word_id: word.backendId,
        sentence: sentence.trim(),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Evaluation failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s) => s >= 8 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-red-600';
  const scoreBg    = (s) => s >= 8 ? 'bg-emerald-50 border-emerald-200' : s >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <section className="pt-6 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Practice Sentence
      </h3>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100/80">
        <p className="text-sm text-amber-800 mb-3 font-medium">
          Write a sentence using{' '}
          <strong className="font-bold text-amber-900 bg-amber-200/50 px-1 rounded">{word.word}</strong>.
          {' '}Our NLP engine will grade your usage and update your review schedule.
        </p>
        <textarea
          value={sentence}
          onChange={e => setSentence(e.target.value)}
          className="w-full bg-white border border-amber-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-shadow text-sm min-h-[80px] resize-none"
          placeholder={`E.g., "The ${word.word.toLowerCase()} beauty of the moment left us speechless."`}
        />
        <div className="mt-3 flex items-center justify-between">
          {result && (
            <button onClick={() => { setResult(null); setSentence(''); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <RotateCcw className="w-3 h-3" /> Try again
            </button>
          )}
          <div className="ml-auto">
            <button onClick={handleEvaluate} disabled={loading || !sentence.trim() || !word?.backendId}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-bold rounded-lg shadow-sm transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating…</> : <><SendHorizonal className="w-4 h-4" />Evaluate Usage</>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mt-4 p-4 rounded-xl border ${scoreBg(result.score)}`}>
              {/* Score row */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-2xl font-extrabold ${scoreColor(result.score)}`}>
                  {result.score}<span className="text-base font-normal opacity-60">/10</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${result.correct_usage ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {result.correct_usage ? '✓ Correct usage' : '✗ Incorrect usage'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${result.grammar_ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {result.grammar_ok ? '✓ Grammar OK' : '✗ Grammar issue'}
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{result.feedback}</p>

              {/* Suggestion */}
              {result.suggestion && (
                <div className="bg-white/70 rounded-lg p-3 border border-amber-200/70 text-xs text-slate-600 italic">
                  <span className="font-bold not-italic text-amber-700 block mb-1">💡 Suggestion</span>
                  {result.suggestion}
                </div>
              )}

              {/* SM-2 note */}
              <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                <Star className="w-3 h-3" />
                {result.score >= 7
                  ? 'Great work! Your next review has been pushed further out.'
                  : result.score >= 4
                  ? 'Keep practising. Your next review is coming up soon.'
                  : 'This word has been reset for an earlier review to help you improve.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── VocabListItem ─────────────────────────────────────────────────────────────

function VocabListItem({ item, isSelected, onSelect, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="relative group">
      <button
        onClick={() => { onSelect(); setConfirming(false); }}
        className={`w-full text-left p-4 rounded-xl transition-all border pr-16 ${
          isSelected ? 'bg-primary-50 border-primary-200 shadow-sm'
                     : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`font-bold ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>{item.word}</span>
          <div className={`w-2 h-2 rounded-full mt-1.5 ${item.strength > 80 ? 'bg-emerald-500' : item.strength > 50 ? 'bg-amber-500' : 'bg-red-400'}`} />
        </div>
        <div className="flex items-center text-xs text-slate-500 gap-2">
          {item.pos && <span className="italic">{item.pos}</span>}
          {item.pos && <span className="w-1 h-1 rounded-full bg-slate-300" />}
          <span className="truncate">{item.meaning}</span>
        </div>
      </button>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {confirming ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-semibold hover:bg-red-600">Yes</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold hover:bg-slate-300">No</button>
          </>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete word">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Vocabulary page ──────────────────────────────────────────────────────

export default function Vocabulary() {
  const [vocabulary, setVocabulary]     = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isAiOpen, setIsAiOpen]         = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [loadingVocab, setLoadingVocab] = useState(true);

  // ── Translation state ──
  const [transLang, setTransLang]       = useState('hi');   // default: Hindi
  const [transText, setTransText]       = useState(null);   // translated string
  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError]     = useState(null);

  // Fetch vocabulary from backend on mount
  useEffect(() => {
    const fetchVocab = async () => {
      try {
        const res = await api.get('/vocabulary/');
        const mapped = res.data.map(mapBackendVocab);
        setVocabulary(mapped);
      } catch (err) {
        console.error('Failed to fetch vocabulary:', err);
      } finally {
        setLoadingVocab(false);
      }
    };
    fetchVocab();
  }, []);

  // Auto-fetch translation whenever selected word or language changes
  useEffect(() => {
    if (!selectedWord) { setTransText(null); return; }

    let cancelled = false;
    const fetchTranslation = async () => {
      setTransLoading(true);
      setTransError(null);
      setTransText(null);
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selectedWord.word)}&langpair=en|${transLang}`
        );
        const json = await res.json();
        if (cancelled) return;
        if (json.responseStatus === 200) {
          setTransText(json.responseData.translatedText);
        } else {
          setTransError('Translation unavailable.');
        }
      } catch {
        if (!cancelled) setTransError('Could not reach translation service.');
      } finally {
        if (!cancelled) setTransLoading(false);
      }
    };

    fetchTranslation();
    return () => { cancelled = true; };
  }, [selectedWord, transLang]);

  const toggleManual = () => {
    setIsManualOpen(v => !v);
    if (!isManualOpen) setIsAiOpen(false);
  };

  const toggleAi = () => {
    setIsAiOpen(v => !v);
    if (!isAiOpen) setIsManualOpen(false);
  };

  const handleAddWord = (entry) => {
    setVocabulary(prev => {
      // avoid exact duplicates (same word + same definition)
      const isDupe = prev.some(
        w => w.word.toLowerCase() === entry.word.toLowerCase() && w.meaning === entry.meaning
      );
      if (isDupe) return prev;
      return [entry, ...prev];
    });
    setSelectedWord(entry);
  };

  const handleDeleteWord = async (wordId) => {
    try {
      await api.delete(`/vocabulary/${wordId}`);
      setVocabulary(prev => prev.filter(w => w.id !== wordId));
      if (selectedWord?.id === wordId) setSelectedWord(null);
    } catch (err) {
      console.error('Failed to delete word:', err);
    }
  };

  const filtered = vocabulary.filter(w =>
    w.word.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col pb-8">

      {/* Page header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Vocabulary Ledger</h2>
          <p className="text-slate-500 mt-1 text-sm">Review, evaluate, and master your saved words.</p>
        </div>
        <div className="flex gap-3">
          {/* AI Extract */}
          <button
            onClick={toggleAi}
            className="group flex flex-col items-center justify-center p-3 w-40 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 group-hover:animate-pulse" /> AI Extract
            </span>
            <span className="text-[10px] opacity-80 mt-0.5 text-center">Paste text &amp; extract</span>
          </button>

          {/* Manual Add */}
          <button
            onClick={toggleManual}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 font-medium rounded-xl shadow-lg transition-all hover:-translate-y-0.5 ${
              isManualOpen
                ? 'bg-slate-700 text-white shadow-slate-700/30'
                : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
            }`}
          >
            <Plus className="w-5 h-5" />
            Manual Add
          </button>
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex-shrink-0 relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -z-10 opacity-50" />
            <AiExtractPanel onClose={() => setIsAiOpen(false)} onAddWord={handleAddWord} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isManualOpen && (
          <ManualAddPanel
            onClose={() => setIsManualOpen(false)}
            onAddWord={handleAddWord}
          />
        )}
      </AnimatePresence>

      {/* Main 2-column layout */}
      <div className="flex-1 min-h-0 flex gap-6 mt-2">

        {/* ── Left: word list ── */}
        <div className="w-1/3 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search saved words…"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loadingVocab ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm font-medium">Loading vocabulary…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                <BookmarkPlus className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-sm font-medium text-center">
                  {vocabulary.length === 0 ? 'No words saved yet.' : 'No results found.'}
                </p>
                <p className="text-xs mt-1 text-center px-4">
                  {vocabulary.length === 0
                    ? 'Use "AI Extract" or "Manual Add" to start building your ledger.'
                    : 'Try a different search term.'}
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <VocabListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedWord?.id === item.id}
                  onSelect={() => setSelectedWord(item)}
                  onDelete={handleDeleteWord}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: word detail ── */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-y-auto z-10 relative">
          {selectedWord ? (
            <div className="p-8">
              {/* word header */}
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-900 mb-1 font-serif">{selectedWord.word}</h1>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500 flex-wrap">
                    {selectedWord.phonetic && (
                      <span className="text-slate-400 font-mono text-base">{selectedWord.phonetic}</span>
                    )}
                    {selectedWord.pos && (
                      <span className="italic text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                        {selectedWord.pos}
                      </span>
                    )}
                    {selectedWord.audioUrl && (
                      <button
                        onClick={() => new Audio(selectedWord.audioUrl).play()}
                        className="flex items-center gap-1.5 hover:text-slate-800 transition-colors p-1 rounded-md hover:bg-slate-100"
                      >
                        <Volume2 className="w-4 h-4" /> Listen
                      </button>
                    )}
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
                {/* Meaning */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Meaning</h3>
                  <p className="text-lg text-slate-800 leading-relaxed font-medium">{selectedWord.meaning}</p>
                </section>

                {/* Translation */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5" /> Translation
                    </h3>
                    <div className="relative">
                      <select
                        value={transLang}
                        onChange={e => setTransLang(e.target.value)}
                        className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        {LANGUAGES.map(l => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="min-h-[44px] flex items-center">
                    {transLoading && (
                      <span className="flex items-center gap-2 text-sm text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Translating…
                      </span>
                    )}
                    {!transLoading && transError && (
                      <span className="text-sm text-red-500">{transError}</span>
                    )}
                    {!transLoading && transText && (
                      <motion.p
                        key={transText}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"
                      >
                        {transText}
                      </motion.p>
                    )}
                  </div>
                </section>

                {/* Examples */}
                {selectedWord.examples.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Example Context</h3>
                    <div className="space-y-3">
                      {selectedWord.examples.map((ex, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                          <p className="text-slate-700 italic pl-2 font-serif">"{ex}"</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Synonyms / Antonyms */}
                {(selectedWord.synonyms?.length > 0 || selectedWord.antonyms?.length > 0) && (
                  <section className="grid grid-cols-2 gap-6">
                    {selectedWord.synonyms?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Synonyms</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedWord.synonyms.slice(0, 8).map(s => (
                            <span key={s} className="text-sm px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedWord.antonyms?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Antonyms</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedWord.antonyms.slice(0, 8).map(a => (
                            <span key={a} className="text-sm px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* AI Context Practice */}
                <PracticeSection word={selectedWord} />
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
