import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validations = {
    username: username.trim().length >= 3,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const isValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      await register(username.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const ValidationHint = ({ valid, text }) => (
    <span className={`flex items-center gap-1.5 text-xs transition-colors ${valid ? 'text-emerald-600' : 'text-slate-400'}`}>
      <CheckCircle2 className={`w-3 h-3 ${valid ? 'text-emerald-500' : 'text-slate-300'}`} />
      {text}
    </span>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 selection:bg-primary-200">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Gradient orbs */}
        <div className="absolute top-1/3 -left-16 w-96 h-96 bg-emerald-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-primary-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-12">
              <BookOpen className="w-10 h-10 text-primary-400" />
              <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">
                WordShelf
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              Start building your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary-400">
                reading intelligence.
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-md">
              Create your account and begin tracking your reading,
              growing your vocabulary, and mastering language with
              AI-powered tools.
            </p>

            {/* Feature highlights */}
            <div className="mt-10 space-y-4">
              {[
                'Track your books and reading progress',
                'Build an intelligent vocabulary ledger',
                'Master words with spaced repetition flashcards',
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-slate-400 text-sm">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Decorative grid pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/80 to-transparent" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>
      </div>

      {/* Right — Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <BookOpen className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold tracking-tight text-slate-900">WordShelf</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create account</h2>
            <p className="text-slate-500 mt-2">
              Set up your WordShelf profile in seconds
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm mb-6"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-700 mb-2">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all shadow-sm hover:border-slate-300"
              />
              {username.length > 0 && (
                <div className="mt-1.5">
                  <ValidationHint valid={validations.username} text="At least 3 characters" />
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all shadow-sm hover:border-slate-300"
              />
              {email.length > 0 && (
                <div className="mt-1.5">
                  <ValidationHint valid={validations.email} text="Valid email address" />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all shadow-sm hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-1.5">
                  <ValidationHint valid={validations.password} text="At least 6 characters" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all shadow-sm hover:border-slate-300"
              />
              {confirmPassword.length > 0 && (
                <div className="mt-1.5">
                  <ValidationHint valid={validations.match} text="Passwords match" />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
