import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, BookOpen, Brain, Flame, Target, Loader2 } from 'lucide-react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { motion } from 'framer-motion';
import api from '../utils/api';

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
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const data = [];
  const activityData = [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Words Learned" 
          value={loading ? '…' : (analytics?.total_vocabulary ?? 0).toString()} 
          icon={Brain} 
          colorClass="bg-primary-50 text-primary-600 shadow-inner shadow-primary-100/50" 
        />
        <StatCard 
          title="Words Mastered" 
          value={loading ? '…' : (analytics?.mastered_vocabulary ?? 0).toString()} 
          icon={Flame} 
          colorClass="bg-orange-50 text-orange-500 shadow-inner shadow-orange-100/50" 
        />
        <StatCard 
          title="Books Read" 
          value={loading ? '…' : (analytics?.books_completed ?? 0).toString()} 
          icon={BookOpen} 
          colorClass="bg-purple-50 text-purple-600 shadow-inner shadow-purple-100/50" 
        />
        <StatCard 
          title="RI Score" 
          value={loading ? '…' : (analytics?.reading_intelligence_score ?? 100).toString()} 
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="words" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Learning Activity Heatmap */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">Learning Activity</h3>
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full">
              <CalendarHeatmap
                startDate={new Date('2026-01-01')}
                endDate={new Date('2026-03-15')}
                values={activityData}
                classForValue={(value) => {
                  if (!value) return 'color-empty opacity-20 bg-slate-100 rounded-sm m-1';
                  if (value.count < 3) return 'fill-primary-300 rounded-sm m-1';
                  if (value.count < 5) return 'fill-primary-500 rounded-sm m-1';
                  return 'fill-primary-700 rounded-sm m-1';
                }}
                showWeekdayLabels={false}
                tooltipDataAttrs={value => {
                  return {
                    'data-tip': `${value.date}: ${value.count} items`,
                  };
                }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-6 text-center">
              Consistent reading builds strong vocabulary. Keep it up!
            </p>
          </div>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.3 }}
         className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Reading Summary</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">{analytics?.total_books ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">Total Books</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">{analytics?.total_pages_read ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">Pages Read</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">{analytics?.learning_vocabulary ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">Words Learning</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">{analytics?.mastered_vocabulary ?? 0}</p>
              <p className="text-sm text-slate-500 mt-1">Words Mastered</p>
            </div>
          </div>
        )}
      </motion.div>

    </div>
  );
}
