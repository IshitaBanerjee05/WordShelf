import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, CheckCircle2, AlertCircle, Loader2, Calendar, Moon, Sun, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ExportModal from '../components/ExportModal';
import api from '../utils/api';

// ── Local dark mode hook (no context needed) ──────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggle = () => {
    setDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('wordshelf-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('wordshelf-theme', 'light');
      }
      return next;
    });
  };

  return { dark, toggle };
}

export default function Profile() {
  const { user } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [showExport, setShowExport] = useState(false);

  const [email, setEmail]           = useState('');
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(null);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPw && newPw !== confirmPw) {
      setError('New passwords do not match.');
      return;
    }
    if (newPw && newPw.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (email !== user.email) payload.email = email;
      if (newPw) {
        payload.current_password = currentPw;
        payload.new_password = newPw;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to save.');
        setSaving(false);
        return;
      }

      await api.put('/auth/me', payload);
      setSuccess('Profile updated successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
    <div className="p-8 max-w-3xl mx-auto space-y-8">

      {/* ── Profile header card ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-primary-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{user?.username}</h2>
          <p className="text-slate-500 mt-0.5">{user?.email}</p>
          {joinDate && (
            <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
              <Calendar className="w-3.5 h-3.5" /> Member since {joinDate}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Appearance card ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          {dark
            ? <Moon className="w-5 h-5 text-primary-400" />
            : <Sun className="w-5 h-5 text-amber-400" />}
          Appearance
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Dark Mode</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {dark ? 'Dark theme is active' : 'Light theme is active'} — saved automatically
            </p>
          </div>

          {/* Toggle switch */}
          <button
            id="dark-mode-toggle"
            onClick={toggle}
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              dark ? 'bg-primary-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-flex h-6 w-6 items-center justify-center transform rounded-full shadow-lg transition-all duration-300 ${
                dark ? 'translate-x-7 bg-slate-900' : 'translate-x-0 bg-white'
              }`}
            >
              {dark
                ? <Moon className="w-3.5 h-3.5 text-primary-300" />
                : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ── Export Proficiency Card ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary-500" />
          Export Proficiency Card
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Download a beautiful 1200×630 PNG snapshot of your vocabulary stats — perfect for sharing.
        </p>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-sm hover:bg-primary-700 shadow-md shadow-primary-500/25 transition-all"
        >
          <Download className="w-4 h-4" /> Generate &amp; Export
        </button>
      </motion.div>

      {/* ── Edit Profile form ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" /> Edit Profile
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Username (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              {user?.username}
              <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Cannot be changed</span>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Change Password */}
          <div className="border-t border-slate-100 pt-6">
            <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" /> Change Password
              <span className="text-xs font-normal text-slate-400">(leave blank to keep current)</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/25 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>

    {/* Export modal */}
    {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
}
