import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BookOpen, Brain, Flame, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

// ── Custom scrollable year-view heatmap ──────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['','Mon','','Wed','','Fri',''];

function buildYearGrid(year, activityMap) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay  = new Date(year, m + 1, 0);
    // pad start so week aligns to Mon (0=Sun→6, 1=Mon→0, …)
    const startPad = (firstDay.getDay() + 6) % 7; // Mon=0
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
  const [tooltip, setTooltip] = useState(null);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const currentMonth = new Date().getMonth(); // 0-indexed
    const monthWidth = 110; // approx px per month column
    scrollRef.current.scrollLeft = Math.max(0, (currentMonth - 1) * monthWidth);
  }, [activityData]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 330, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 transition-colors -ml-3"
      >
        <ChevronLeft className="w-4 h-4 text-slate-500" />
      </button>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 transition-colors -mr-3"
      >
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </button>

      {/* Scrollable calendar */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide px-1 py-1"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex gap-3 min-w-max">
          {/* Day-of-week labels column */}
          <div className="flex flex-col gap-0.5 mt-5 mr-0.5">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="h-[11px] text-[9px] text-slate-400 leading-none flex items-center">{l}</div>
            ))}
          </div>

          {/* Month columns */}
          {months.map(({ name, weeks }) => (
            <div key={name} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400 mb-1">{name}</span>
              <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((cell, di) => (
                      cell === null
                        ? <div key={di} className="w-[11px] h-[11px]" />
                        : <div
                            key={di}
                            className={`w-[11px] h-[11px] rounded-sm cursor-default transition-opacity hover:opacity-80 ${cellColor(cell.count)}`}
                            title={`${cell.date}: ${cell.count} word${cell.count !== 1 ? 's' : ''}`}
                          />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
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

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"
  >
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <span className="text-sm font-medium text-emerald-600 flex items-center gap-0.5">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
    </div>
    <div className={`p-4 rounded-xl ${colorClass}`}>
      <Icon className="w-8 h-8" />
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_vocabulary: 0,
    total_books: 0,
    reading_intelligence_score: '—',
  });
  const [data, setData] = useState([]);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    // Fetch stats, growth chart, and full-year activity independently
    // so that a failure in one doesn't block the others.
    api.get('/analytics/').then(res => {
      setStats({
        total_vocabulary: res.data.total_vocabulary,
        total_books: res.data.total_books,
        reading_intelligence_score: res.data.reading_intelligence_score,
      });
    }).catch(console.error);

    api.get('/analytics/vocab-growth').then(res => {
      setData(res.data);
    }).catch(console.error);

    api.get('/analytics/activity').then(res => {
      setActivityData(res.data);
    }).catch(console.error);
  }, []);
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Words Learned"
          value={stats.total_vocabulary}
          icon={Brain}
          colorClass="bg-primary-50 text-primary-600 shadow-inner shadow-primary-100/50"
        />
        <StatCard
          title="Current Streak"
          value="0 Days"
          icon={Flame}
          colorClass="bg-orange-50 text-orange-500 shadow-inner shadow-orange-100/50"
        />
        <StatCard
          title="Books Read"
          value={stats.total_books}
          icon={BookOpen}
          colorClass="bg-purple-50 text-purple-600 shadow-inner shadow-purple-100/50"
        />
        <StatCard
          title="RI Score"
          value={stats.reading_intelligence_score}
          icon={Target}
          colorClass="bg-emerald-50 text-emerald-600 shadow-inner shadow-emerald-100/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vocabulary Growth Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Vocabulary Growth (This Week)</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72" style={{ height: '288px', minHeight: '288px' }}>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="words" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Learning Activity Heatmap — full year, scrollable */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-1">Learning Activity</h3>
          <p className="text-xs text-slate-400 mb-4">Words added per day · {new Date().getFullYear()}</p>
          <ActivityCalendar activityData={activityData} />
          <p className="text-xs text-slate-400 mt-4 text-center">
            Scroll left/right to browse the full year ←→
          </p>
        </motion.div>
      </div>

      {/* Suggested Revision */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Suggested Revision</h3>
          <button className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Brain className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-medium text-sm">No words to revise yet.</p>
          <p className="text-xs mt-1">Add vocabulary from the Vocabulary Ledger to get started.</p>
        </div>
      </motion.div>

    </div>
  );
}

