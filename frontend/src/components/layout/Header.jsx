import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { HiSun, HiMoon, HiBell, HiLogout, HiMenuAlt2 } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          <HiMenuAlt2 className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline-block font-medium text-xs tracking-wider uppercase text-slate-400 dark:text-slate-500">
          Campus Asset Network
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <HiSun className="w-5 h-5 text-amber-400" /> : <HiMoon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
          title="Notifications"
        >
          <HiBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile info */}
        <div className="flex items-center pl-3 border-l border-slate-200 dark:border-slate-800 space-x-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {user?.name}
            </span>
            <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Log Out"
          >
            <HiLogout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

