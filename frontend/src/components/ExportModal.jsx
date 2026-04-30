/**
 * ExportModal.jsx
 *
 * Opens when the user clicks "Export Proficiency Card".
 * Fetches /analytics/proficiency-summary, shows a scaled live preview,
 * lets the user toggle dark/light theme, and downloads a 1200×630 PNG
 * via html-to-image (handles modern CSS oklch/oklch without issues).
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, Moon, Sun, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import ProficiencyCard from './ProficiencyCard';
import api from '../utils/api';

export default function ExportModal({ onClose }) {
  const cardRef   = useRef(null);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [theme, setTheme]         = useState('dark');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/analytics/proficiency-summary')
      .then(r => setData(r.data))
      .catch(() => setError('Could not load your stats. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      // toPng uses SVG foreignObject — handles oklch and all modern CSS natively
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,        // 2× for crisp retina export
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `wordshelf-proficiency-${data?.username ?? 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  // Scale 1200×630 card to fit ~700px preview width
  const PREVIEW_W = 700;
  const SCALE     = PREVIEW_W / 1200;
  const PREVIEW_H = 630 * SCALE;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      >
        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export Proficiency Card</h2>
              <p className="text-sm text-slate-500 mt-0.5">Preview your card · download as PNG</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark / Light toggle */}
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {theme === 'dark'
                  ? <><Moon className="w-3.5 h-3.5 text-primary-500" /> Dark</>
                  : <><Sun className="w-3.5 h-3.5 text-amber-500" /> Light</>
                }
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="px-6 py-5 bg-slate-50 flex items-center justify-center" style={{ minHeight: PREVIEW_H + 40 }}>
            {loading && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading your stats…</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            {!loading && !error && data && (
              /* Outer visible area (scaled) */
              <div style={{
                width: PREVIEW_W,
                height: PREVIEW_H,
                overflow: 'hidden',
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                flexShrink: 0,
                position: 'relative',
              }}>
                {/* Scale transform wrapper */}
                <div style={{
                  transform: `scale(${SCALE})`,
                  transformOrigin: 'top left',
                  width: 1200,
                  height: 630,
                }}>
                  {/* The actual full-size card — ref used for capture */}
                  <ProficiencyCard data={data} theme={theme} cardRef={cardRef} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Exports at 1200 × 630 px (2× retina) — ideal for social sharing</p>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={!data || exporting}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white font-semibold rounded-xl text-sm hover:bg-primary-700 shadow-md shadow-primary-500/25 disabled:opacity-40 transition-all"
              >
                {exporting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
                  : <><Download className="w-4 h-4" /> Download PNG</>
                }
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
