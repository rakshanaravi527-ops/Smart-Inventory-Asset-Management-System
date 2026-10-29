import React, { useEffect, useState, useCallback } from 'react';
import { get, patch } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotifications } from '../../context/NotificationContext';
import {
  HiBell,
  HiCheckCircle,
  HiCog,
  HiClock,
  HiExclamation,
  HiInformationCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshNotifications } = useNotifications();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/notifications', { limit: 50 });
      setNotifications(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshNotifications();
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return <HiCog className="text-amber-500 text-lg" />;
      case 'overdue':
        return <HiClock className="text-rose-500 text-lg" />;
      case 'lowStock':
        return <HiExclamation className="text-rose-500 text-lg" />;
      default:
        return <HiInformationCircle className="text-blue-500 text-lg" />;
    }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Alerts & Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated alerts for calibration due dates, overdue returns, and low stock thresholds
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <HiCheckCircle className="mr-1.5 text-sm" /> Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <HiBell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            You're all caught up!
          </p>
          <p className="text-xs text-slate-400 mt-1">No active alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition flex items-start space-x-4 cursor-pointer ${
                n.read
                  ? 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900 text-slate-900 dark:text-slate-100 shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm ${n.read ? 'font-semibold' : 'font-black'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600 flex-shrink-0 mt-2"></span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
