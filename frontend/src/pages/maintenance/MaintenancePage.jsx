import React, { useEffect, useState, useCallback } from 'react';
import { get, post } from '../../api/client';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { HiCog, HiExclamation, HiCalendar, HiPlus, HiClock } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('upcoming');

  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'LAB_INCHARGE';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [upRes, schedRes, logRes] = await Promise.all([
        get('/maintenance/upcoming'),
        get('/maintenance/schedules'),
        get('/maintenance/logs'),
      ]);

      setUpcomingItems(upRes.data?.data?.upcoming || []);
      setOverdueItems(upRes.data?.data?.overdue || []);
      setSchedules(schedRes.data?.data || []);
      setLogs(logRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner text="Loading maintenance records..." />;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Automated Maintenance & Calibration Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Preventative maintenance intervals, ISO calibration cycles, and certified technician service records
          </p>
        </div>
      </div>

      {/* Overdue and Upcoming Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue Card */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm mb-3">
            <HiExclamation className="text-lg" />
            <span>Overdue Maintenance ({overdueItems.length})</span>
          </div>

          {overdueItems.length === 0 ? (
            <p className="text-xs text-rose-600/70 py-3">All equipment maintenance is up to date.</p>
          ) : (
            <div className="space-y-2">
              {overdueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 text-xs shadow-sm"
                >
                  <div>
                    <Link
                      to={`/assets/${item.assetId}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-primary-600 block"
                    >
                      {item.asset?.name}
                    </Link>
                    <span className="text-slate-400 font-mono">
                      {item.asset?.assetCode} • {item.type}
                    </span>
                  </div>
                  <span className="font-bold text-rose-600">
                    Due: {new Date(item.nextDueDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Card */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 font-bold text-sm mb-3">
            <HiClock className="text-lg" />
            <span>Upcoming Due (Next 30 Days) ({upcomingItems.length})</span>
          </div>

          {upcomingItems.length === 0 ? (
            <p className="text-xs text-blue-600/70 py-3">No maintenance due in the next 30 days.</p>
          ) : (
            <div className="space-y-2">
              {upcomingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 text-xs shadow-sm"
                >
                  <div>
                    <Link
                      to={`/assets/${item.assetId}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-primary-600 block"
                    >
                      {item.asset?.name}
                    </Link>
                    <span className="text-slate-400 font-mono">
                      {item.asset?.assetCode} • {item.type}
                    </span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    Due: {new Date(item.nextDueDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Schedules vs Service History */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm font-semibold space-x-6">
          <button
            onClick={() => setViewTab('upcoming')}
            className={`pb-3 border-b-2 transition ${
              viewTab === 'upcoming'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                : 'border-transparent text-slate-500'
            }`}
          >
            All Active Schedules ({schedules.length})
          </button>
          <button
            onClick={() => setViewTab('logs')}
            className={`pb-3 border-b-2 transition ${
              viewTab === 'logs'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                : 'border-transparent text-slate-500'
            }`}
          >
            Completed Service Logs ({logs.length})
          </button>
        </div>

        {viewTab === 'upcoming' ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Asset Code</th>
                  <th className="p-3.5">Equipment</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Interval</th>
                  <th className="p-3.5">Alert Buffer</th>
                  <th className="p-3.5">Next Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3.5 font-mono font-bold text-primary-600">
                      {s.asset?.assetCode}
                    </td>
                    <td className="p-3.5 font-semibold">{s.asset?.name}</td>
                    <td className="p-3.5 uppercase font-medium">{s.type}</td>
                    <td className="p-3.5">{s.intervalDays} days</td>
                    <td className="p-3.5">{s.alertDaysBefore} days before</td>
                    <td className="p-3.5 font-bold">
                      {new Date(s.nextDueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Equipment</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Technician</th>
                  <th className="p-3.5">Cost</th>
                  <th className="p-3.5">Service Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="p-3.5">{new Date(l.performedDate).toLocaleDateString()}</td>
                    <td className="p-3.5 font-semibold">{l.asset?.name}</td>
                    <td className="p-3.5 uppercase font-medium">{l.type}</td>
                    <td className="p-3.5">{l.performedBy?.name}</td>
                    <td className="p-3.5 font-bold text-emerald-600">${l.cost ?? 0}</td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{l.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
