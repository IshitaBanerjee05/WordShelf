import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, Brain, Flame, Target, ChevronLeft, ChevronRight, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// ── Heatmap helpers ───────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['','Mon','','Wed','','Fri',''];

function buildYearGrid(year, activityMap) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay  = new Date(year, m + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const weeks = [];
    let week = Array(startPad).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const iso = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      week.push({ date: iso, count: activityMap[iso] ?? 0 });
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
    months.push({ name: MONTHS[m], weeks });
  }
  return months;
}

function cellColor(count) {
  if (!count) return 'bg-slate-100';
  if (count === 1) return 'bg-primary-200';
  if (count <= 3) return 'bg-primary-400';
  if (count <= 6) return 'bg-primary-500';
  return 'bg-primary-700';
}

function ActivityCalendar({ activityData }) {
  const year = new Date().getFullYear();
  const activityMap = {};
  activityData.forEach(({ date, count }) => { activityMap[date] = count; });
  const months = buildYearGrid(year, activityMap);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const currentMonth = new Date().getMonth();
    scrollRef.current.scrollLeft = Math.max(0, (currentMonth - 1) * 110);
  }, [activityData]);

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 330, behavior: 'smooth' });

  return (
    <div className="relative">
      <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 -ml-3">
        <ChevronLeft className="w-4 h-4 text-slate-500" />
      </button>
      <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 -mr-3">
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>
      <div ref={scrollRef} className="overflow-x-auto px-1 py-1" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-3 min-w-max">
          <div className="flex flex-col gap-0.5 mt-5 mr-0.5">
            {DAY_LABELS.map((l, i) => <div key={i} className="h-[11px] text-[9px] text-slate-400 leading-none flex items-center">{l}</div>)}
          </div>
          {months.map(({ name, weeks }) => (
            <div key={name} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 mb-1">{name}</span>
              <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((cell, di) => cell === null
                      ? <div key={di} className="w-[11px] h-[11px]" />
                      : <div key={di} className={`w-[11px] h-[11px] rounded-sm cursor-default hover:opacity-80 ${cellColor(cell.count)}`} title={`${cell.date}: ${cell.count} word${cell.count !== 1 ? 's' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end text-[10px] text-slate-400">
        <span>Less</span>
        {['bg-slate-100','bg-primary-200','bg-primary-400','bg-primary-500','bg-primary-700'].map(c => (
          <div key={c} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass, loading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        {loading
          ? <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg mt-1" />
          : <h3 className="text-3xl font-bold text-slate-900">{value}</h3>}
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon className="w-8 h-8" />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [stats, setStats]               = useState(null);
  const [streak, setStreak]             = useState(null);
  const [data, setData]                 = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [dueWords, setDueWords]         = useState([]);
  const [period, setPeriod]             = useState('week');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, streakRes, growthRes, activityRes, dueRes] = await Promise.all([
          api.get('/analytics/'),
          api.get('/analytics/streak'),
          api.get('/analytics/vocab-growth?period=week'),
          api.get('/analytics/activity'),
          api.get('/vocabulary/review/due?limit=5'),
        ]);
        setStats(statsRes.data);
        setStreak(streakRes.data.current_streak);
        setData(growthRes.data);
        setActivityData(activityRes.data);
        setDueWords(dueRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handlePeriodChange = async (newPeriod) => {
    setPeriod(newPeriod);
    setChartLoading(true);
    try {
      const res = await api.get(`/analytics/vocab-growth?period=${newPeriod}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  const periodLabel = { week: 'This Week', month: 'This Month', year: 'This Year' };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Words Learned" value={stats?.total_vocabulary ?? 0}
          icon={Brain} colorClass="bg-primary-50 text-primary-600 shadow-inner shadow-primary-100/50" loading={loading} />
        <StatCard
          title="Current Streak"
          value={streak !== null ? `${streak} Day${streak !== 1 ? 's' : ''}` : '—'}
          icon={Flame} colorClass="bg-orange-50 text-orange-500 shadow-inner shadow-orange-100/50" loading={loading} />
        <StatCard title="Books Added" value={stats?.total_books ?? 0}
          icon={BookOpen} colorClass="bg-purple-50 text-purple-600 shadow-inner shadow-purple-100/50" loading={loading} />
        <StatCard title="RI Score" value={stats?.reading_intelligence_score ?? '—'}
          icon={Target} colorClass="bg-emerald-50 text-emerald-600 shadow-inner shadow-emerald-100/50" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vocab Growth Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Vocabulary Growth ({periodLabel[period]})</h3>
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div style={{ height: '288px' }}>
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="words" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Learning Activity</h3>
          <p className="text-xs text-slate-400 mb-4">Words added per day · {new Date().getFullYear()}</p>
          {loading
            ? <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
            : <ActivityCalendar activityData={activityData} />}
          <p className="text-xs text-slate-400 mt-4 text-center">Scroll left/right to browse the full year ←→</p>
        </motion.div>
      </div>

      {/* Suggested Revision */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Suggested Revision</h3>
          <button onClick={() => navigate('/flashcards')}
            className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Start Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : dueWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Brain className="w-12 h-12 opacity-20 mb-3" />
            <p className="font-medium text-sm">No words to revise yet.</p>
            <p className="text-xs mt-1">Add vocabulary from the Vocabulary Ledger to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {dueWords.map((v) => (
              <button key={v.id} onClick={() => navigate('/flashcards')}
                className="group text-left p-4 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-200 rounded-xl transition-all">
                <p className="font-bold text-slate-800 group-hover:text-primary-700 capitalize mb-1 truncate">{v.word}</p>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{v.definition || 'No definition'}</p>
                <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  v.learning_status === 'mastered' ? 'bg-emerald-100 text-emerald-700'
                  : v.learning_status === 'learning' ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-200 text-slate-600'
                }`}>{v.learning_status}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
