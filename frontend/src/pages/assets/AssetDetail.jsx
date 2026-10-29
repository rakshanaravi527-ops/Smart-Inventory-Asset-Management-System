import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get, post, patch, del } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import {
  HiPencil,
  HiTrash,
  HiClipboardCopy,
  HiPrinter,
  HiClock,
  HiCog,
  HiUser,
  HiOutlineCalendar,
  HiQrcode,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'LAB_INCHARGE';

  const [asset, setAsset] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Modals
  const [retireModal, setRetireModal] = useState(false);
  const [retireReason, setRetireReason] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkoutPurpose, setCheckoutPurpose] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleType, setScheduleType] = useState('maintenance');
  const [scheduleInterval, setScheduleInterval] = useState(90);
  const [scheduleAlertDays, setScheduleAlertDays] = useState(7);
  const [scheduleNextDue, setScheduleNextDue] = useState('');
  const [logModal, setLogModal] = useState(false);
  const [logCost, setLogCost] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const loadAsset = useCallback(async () => {
    try {
      const [assetRes, qrRes] = await Promise.all([
        get(`/assets/${id}`),
        get(`/assets/${id}/qr`).catch(() => null),
      ]);
      setAsset(assetRes.data?.data);
      if (qrRes?.data?.data?.qrCode) {
        setQrCodeUrl(qrRes.data.data.qrCode);
      }
    } catch (err) {
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const handleRetire = async () => {
    if (!retireReason.trim()) {
      toast.error('Please specify a retirement reason');
      return;
    }
    try {
      await del(`/assets/${id}`, { data: { reason: retireReason } });
      toast.success('Asset retired successfully');
      setRetireModal(false);
      loadAsset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to retire asset');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      await post('/checkout', {
        assetId: id,
        purpose: checkoutPurpose,
        expectedReturn: expectedReturn ? new Date(expectedReturn).toISOString() : null,
      });
      toast.success('Asset checked out successfully');
      setCheckoutModal(false);
      loadAsset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await post('/maintenance/schedules', {
        assetId: id,
        type: scheduleType,
        intervalDays: Number(scheduleInterval),
        alertDaysBefore: Number(scheduleAlertDays),
        nextDueDate: new Date(scheduleNextDue).toISOString(),
      });
      toast.success('Maintenance schedule added');
      setScheduleModal(false);
      loadAsset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create schedule');
    }
  };

  const handleLogMaintenance = async (e) => {
    e.preventDefault();
    try {
      await post('/maintenance/logs', {
        assetId: id,
        type: scheduleType,
        cost: logCost ? Number(logCost) : 0,
        notes: logNotes,
      });
      toast.success('Maintenance log recorded');
      setLogModal(false);
      loadAsset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log maintenance');
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Asset QR Label - ${asset.assetCode}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { border: 2px dashed #333; padding: 24px; border-radius: 12px; text-align: center; max-width: 300px; }
            img { width: 180px; height: 180px; }
            h2 { margin: 8px 0 4px; font-size: 18px; }
            p { margin: 2px 0; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${qrCodeUrl}" />
            <h2>${asset.assetCode}</h2>
            <p><strong>${asset.name}</strong></p>
            <p>${asset.department?.name}</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <LoadingSpinner text="Loading asset..." />;
  if (!asset) return <div>Asset not found</div>;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1 rounded-lg">
              {asset.assetCode}
            </span>
            <StatusBadge status={asset.status} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {asset.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {asset.status === 'Available' && (
            <button
              onClick={() => setCheckoutModal(true)}
              className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-500 shadow-md shadow-primary-600/30 transition"
            >
              Check Out Asset
            </button>
          )}

          {canManage && (
            <>
              <Link
                to={`/assets/${id}/edit`}
                className="flex items-center px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <HiPencil className="w-4 h-4 mr-1.5" /> Edit
              </Link>

              {asset.status !== 'Retired' && (
                <button
                  onClick={() => setRetireModal(true)}
                  className="flex items-center px-3.5 py-2 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <HiTrash className="w-4 h-4 mr-1.5" /> Retire
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main layout: left info, right QR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm font-semibold space-x-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Asset Details
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === 'maintenance'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Maintenance ({asset.maintenanceSchedules?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === 'usage'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Usage History ({asset.usageLogs?.length || 0})
            </button>
          </div>

          {/* Details Tab Content */}
          {activeTab === 'details' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.category?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Department</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.department?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Location</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.location ? `${asset.location.name} (${asset.location.room})` : 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Serial Number</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.serialNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Purchase Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Cost</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                    ${asset.cost ? Number(asset.cost).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Warranty Expiry</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Condition</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.condition}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">Vendor</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {asset.vendor || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Current Holder / Accountability */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <HiUser />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold block">Current Custodian</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {asset.currentHolder ? asset.currentHolder.name : 'In Storage / Available'}
                    </span>
                  </div>
                </div>

                {asset.lastCheckedDate && (
                  <div className="text-right text-xs text-slate-400">
                    <span>Last audited: </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {new Date(asset.lastCheckedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Retirement Details if retired */}
              {asset.status === 'Retired' && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-300 block mb-1">
                    Asset Retired
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Reason: {asset.retirementReason || 'No reason provided'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Recurring Schedules
                </h3>
                {canManage && (
                  <button
                    onClick={() => setScheduleModal(true)}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-500"
                  >
                    + Add Schedule
                  </button>
                )}
              </div>

              {asset.maintenanceSchedules?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  No active maintenance schedules configured for this asset.
                </div>
              ) : (
                <div className="space-y-2">
                  {asset.maintenanceSchedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div>
                        <span className="font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                          {s.type}
                        </span>
                        <div className="text-slate-400 mt-0.5">
                          Repeats every {s.intervalDays} days • Alert {s.alertDaysBefore} days before
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold block text-slate-700 dark:text-slate-300">
                          Due: {new Date(s.nextDueDate).toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Maintenance Logs */}
              <div className="flex items-center justify-between pt-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Maintenance History
                </h3>
                {canManage && (
                  <button
                    onClick={() => setLogModal(true)}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold"
                  >
                    + Record Service Log
                  </button>
                )}
              </div>

              {asset.maintenanceLogs?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  No service logs recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {asset.maintenanceLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{log.type.toUpperCase()} Log</span>
                        <span className="text-emerald-600 font-semibold">${log.cost ?? 0}</span>
                      </div>
                      <p className="text-slate-500">{log.notes || 'No notes'}</p>
                      <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                        <span>Service Date: {new Date(log.performedDate).toISOString().split('T')[0]}</span>
                        <span>Recorded by: {log.performedBy?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Check-out</th>
                    <th className="p-3">Returned</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {asset.usageLogs?.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-semibold">{u.user?.name}</td>
                      <td className="p-3 text-slate-500">{u.purpose || '—'}</td>
                      <td className="p-3">{new Date(u.checkoutTime).toLocaleDateString()}</td>
                      <td className="p-3">
                        {u.actualReturn ? new Date(u.actualReturn).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={u.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: QR Tag Card & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-4">
              Barcode / QR Asset Tag
            </h3>

            {qrCodeUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 object-contain" />
              </div>
            ) : (
              <div className="w-44 h-44 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <HiQrcode className="w-12 h-12" />
              </div>
            )}

            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
              {asset.assetCode}
            </span>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] truncate">{asset.name}</p>

            <button
              onClick={handlePrintQR}
              className="mt-4 flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition"
            >
              <HiPrinter className="w-4 h-4 mr-1.5" /> Print Tag Label
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal isOpen={checkoutModal} onClose={() => setCheckoutModal(false)} title="Check Out Asset">
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Purpose</label>
            <input
              type="text"
              required
              value={checkoutPurpose}
              onChange={(e) => setCheckoutPurpose(e.target.value)}
              placeholder="e.g. Laboratory Experiment 4, Final Year Project"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Expected Return Date
            </label>
            <input
              type="date"
              required
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setCheckoutModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-500"
            >
              Confirm Check-out
            </button>
          </div>
        </form>
      </Modal>

      {/* Retire Modal */}
      <Modal isOpen={retireModal} onClose={() => setRetireModal(false)} title="Retire Asset">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Retiring this asset flags it as inactive and prevents any future checkouts or operational assignments.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Retirement Reason
            </label>
            <textarea
              rows={3}
              required
              value={retireReason}
              onChange={(e) => setRetireReason(e.target.value)}
              placeholder="e.g. Beyond economical repair, Obsolete technology, Damaged beyond salvage"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setRetireModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border"
            >
              Cancel
            </button>
            <button
              onClick={handleRetire}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500"
            >
              Confirm Retirement
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Schedule Modal */}
      <Modal isOpen={scheduleModal} onClose={() => setScheduleModal(false)} title="Schedule Maintenance">
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Type</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="maintenance">Routine Maintenance</option>
              <option value="calibration">Precision Calibration</option>
              <option value="renewal">Compliance / License Renewal</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Interval (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={scheduleInterval}
                onChange={(e) => setScheduleInterval(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Alert Days Before</label>
              <input
                type="number"
                min="1"
                required
                value={scheduleAlertDays}
                onChange={(e) => setScheduleAlertDays(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">First Due Date</label>
            <input
              type="date"
              required
              value={scheduleNextDue}
              onChange={(e) => setScheduleNextDue(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setScheduleModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Service Log Modal */}
      <Modal isOpen={logModal} onClose={() => setLogModal(false)} title="Record Maintenance Service Log">
        <form onSubmit={handleLogMaintenance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Type</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="maintenance">Routine Maintenance</option>
              <option value="calibration">Calibration</option>
              <option value="repair">Emergency Repair</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost ($)</label>
            <input
              type="number"
              step="0.01"
              value={logCost}
              onChange={(e) => setLogCost(e.target.value)}
              placeholder="0.00"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Technician Notes</label>
            <textarea
              rows={3}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Describe what parts were serviced or replaced..."
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setLogModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white"
            >
              Save Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
