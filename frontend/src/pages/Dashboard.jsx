import React, { useEffect, useState } from 'react';
import { get } from '../api/client';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import {
  HiCube,
  HiCheckCircle,
  HiClipboardList,
  HiCog,
  HiExclamationCircle,
  HiClock,
} from 'react-icons/hi';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  Available: '#10b981',
  InUse: '#3b82f6',
  UnderMaintenance: '#f59e0b',
  Retired: '#ef4444',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recentActivity, setRecentActivity] = useState({ recentCheckouts: [], recentMaintenance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, catRes, deptRes, statusRes, actRes] = await Promise.all([
          get('/dashboard/stats'),
          get('/dashboard/charts/by-category'),
          get('/dashboard/charts/by-department'),
          get('/dashboard/charts/by-status'),
          get('/dashboard/charts/recent-activity'),
        ]);

        setStats(statsRes.data?.data);
        setCategoryData(catRes.data?.data || []);
        setDeptData(deptRes.data?.data || []);
        setStatusData(statusRes.data?.data || []);
        setRecentActivity(actRes.data?.data || { recentCheckouts: [], recentMaintenance: [] });
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard analytics..." />;
  }

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Asset Overview & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of laboratory instruments, departmental stores, and institutional inventory
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/scan"
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs hover:opacity-90 transition shadow-sm"
          >
            Quick Scan QR
          </Link>
          <Link
            to="/assets/new"
            className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-500 transition shadow-sm"
          >
            + Register Asset
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Assets"
          value={stats?.totalAssets ?? 0}
          icon={HiCube}
          color="blue"
        />
        <StatCard
          title="Available"
          value={stats?.available ?? 0}
          icon={HiCheckCircle}
          color="green"
        />
        <StatCard
          title="In Use"
          value={stats?.inUse ?? 0}
          icon={HiClipboardList}
          color="indigo"
        />
        <StatCard
          title="Maintenance"
          value={stats?.underMaintenance ?? 0}
          icon={HiCog}
          color="amber"
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockItems ?? 0}
          icon={HiExclamationCircle}
          color="rose"
          subtitle="Consumables"
        />
        <StatCard
          title="Overdue"
          value={(stats?.overdueMaintenanceCount ?? 0) + (stats?.overdueCheckoutsCount ?? 0)}
          icon={HiClock}
          color="purple"
          subtitle="Alerts active"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets by Status - Donut */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Asset Status Distribution
          </h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets by Category - Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Assets by Category
          </h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets by Department - Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Assets by Department
          </h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Checkouts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Recent Check-outs
            </h3>
            <Link to="/checkout" className="text-xs font-semibold text-primary-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.recentCheckouts?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent check-outs</p>
            ) : (
              recentActivity.recentCheckouts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {item.asset?.name}
                    </span>
                    <span className="text-slate-400">
                      User: {item.user?.name} • {item.purpose || 'No purpose stated'}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Recent Maintenance Logs
            </h3>
            <Link to="/maintenance" className="text-xs font-semibold text-primary-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.recentMaintenance?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No maintenance logs found</p>
            ) : (
              recentActivity.recentMaintenance.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {log.asset?.name} ({log.type})
                    </span>
                    <span className="text-slate-400">
                      Performed by: {log.performedBy?.name} • Cost: ${log.cost ?? 0}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    {new Date(log.performedDate).toISOString().split('T')[0]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
