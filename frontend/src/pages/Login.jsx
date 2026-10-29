import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiLockClosed,
  HiMail,
  HiEye,
  HiEyeOff,
  HiShieldCheck,
  HiSparkles,
  HiQrcode,
  HiCheck,
  HiLightningBolt,
} from 'react-icons/hi';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    title: 'System Administrator',
    badge: 'Full Access',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    email: 'admin@college.edu',
    pass: 'admin123',
    desc: 'Manage users, departments & system audit logs',
  },
  {
    role: 'Lab Incharge',
    title: 'Store / Lab Manager',
    badge: 'Operations',
    badgeColor: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    email: 'labincharge@college.edu',
    pass: 'lab123',
    desc: 'Asset registration, calibrations & checkouts',
  },
  {
    role: 'Staff / Student',
    title: 'Research Scholar',
    badge: 'Self-Service',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    email: 'staff@college.edu',
    pass: 'staff123',
    desc: 'Browse equipment & borrow items',
  },
  {
    role: 'Dept Head',
    title: 'Department Head',
    badge: 'Executive',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    email: 'depthead@college.edu',
    pass: 'dept123',
    desc: 'Read-only analytics & utilization audits',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
    setSelectedRole(account.email);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-primary-500 selection:text-white">
      {/* Decorative Background Lighting & Mesh */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/20 to-indigo-600/0 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tl from-purple-600/20 to-pink-600/0 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/80">
          
          {/* ================= LEFT COLUMN: HERO & BRANDING ================= */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-950/80 relative">
            {/* Top brand header */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30 border border-white/20">
                  SI
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-white text-lg tracking-tight">SmartAsset</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-500/10 text-primary-400 border border-primary-500/30">
                      College OS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Smart Inventory & Asset Management</p>
                </div>
              </div>

              {/* Catchy Headline */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Unified asset governance for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                  college laboratories.
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Replace manual paper registers with instant QR barcode tagging, automated calibration alarms,
                real-time consumable thresholds, and tamper-proof audit trails.
              </p>

              {/* Key Highlights Grid */}
              <div className="mt-8 space-y-3.5">
                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 text-base border border-blue-500/20">
                    <HiQrcode />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">Barcode & Camera QR Scanning</div>
                    <div className="text-slate-400 mt-0.5">Generate printable asset label sheets & scan directly in-browser.</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 text-base border border-amber-500/20">
                    <HiLightningBolt />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">Automated Calibration Alarms</div>
                    <div className="text-slate-400 mt-0.5">Configurable cron scheduler alerts lab incharge before maintenance is due.</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 text-base border border-emerald-500/20">
                    <HiShieldCheck />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">Accountability & Check-out Records</div>
                    <div className="text-slate-400 mt-0.5">Know who is holding which equipment, return expectations & return conditions.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Metrics Pill */}
            <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-300">Database Synchronized</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Node • Express • Prisma • React</span>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LOGIN FORM & QUICK ACCOUNTS ================= */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-slate-900/60">
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight">Institutional Portal</h2>
                <p className="text-xs text-slate-400 mt-1">Sign in with your academic credentials or select a demo profile</p>
              </div>

              {error && (
                <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/70 text-rose-300 text-xs font-medium flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Academic Email
                  </label>
                  <div className="relative group">
                    <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors text-lg" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSelectedRole(null);
                      }}
                      placeholder="name@college.edu"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative group">
                    <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors text-lg" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 text-lg transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <HiEyeOff /> : <HiEye />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Remember on this browser</span>
                  </label>
                  <span className="text-slate-500 cursor-not-allowed">Institutional SSO</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 hover:from-primary-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary-600/30 transition-all duration-200 transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Laboratory Workspace</span>
                      <span className="text-base">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* ================= QUICK DEMO PERSONAS ================= */}
              <div className="mt-8 pt-6 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <HiSparkles className="text-primary-400" />
                    <span>One-Click Demo Personas</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Instant credential fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSelected = selectedRole === acc.email;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleSelectRole(acc)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'bg-primary-950/40 border-primary-500 shadow-md shadow-primary-900/30'
                            : 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px]">
                            <HiCheck />
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white group-hover:text-primary-300 transition-colors">
                            {acc.role}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${acc.badgeColor}`}
                          >
                            {acc.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{acc.desc}</p>
                        <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center justify-between">
                          <span>{acc.email}</span>
                          <span className="text-slate-600">pw: {acc.pass}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[11px] text-slate-500">
              Departmental Asset Network • Institutional Governance Edition
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
