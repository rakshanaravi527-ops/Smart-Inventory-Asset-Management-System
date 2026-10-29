import React, { useEffect, useState, useCallback } from 'react';
import { get, post } from '../../api/client';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiClipboardCheck, HiPlus, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Available assets for checkout
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');

  // Modals
  const [newCheckoutModal, setNewCheckoutModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

  // Checkin Modal
  const [checkinModal, setCheckinModal] = useState(false);
  const [checkinItem, setCheckinItem] = useState(null);
  const [conditionOnReturn, setConditionOnReturn] = useState('Good');

  const fetchCheckouts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await get('/checkout', { page, limit: 10 });
      setCheckouts(res.data?.data || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load checkouts');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailableAssets = async () => {
    try {
      const res = await get('/assets', { status: 'Available', limit: 50 });
      setAvailableAssets(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCheckouts(1);
    loadAvailableAssets();
  }, [fetchCheckouts]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please choose an asset');
      return;
    }

    try {
      await post('/checkout', {
        assetId: selectedAssetId,
        purpose,
        expectedReturn: expectedReturn ? new Date(expectedReturn).toISOString() : null,
      });

      toast.success('Equipment checked out successfully');
      setNewCheckoutModal(false);
      setSelectedAssetId('');
      setPurpose('');
      setExpectedReturn('');
      fetchCheckouts(1);
      loadAvailableAssets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!checkinItem) return;

    try {
      await post(`/checkout/${checkinItem.id}/checkin`, {
        conditionOnReturn,
      });

      toast.success('Asset returned and inspected successfully');
      setCheckinModal(false);
      setCheckinItem(null);
      fetchCheckouts(1);
      loadAvailableAssets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const columns = [
    {
      header: 'Asset Code',
      accessor: 'asset',
      render: (r) => (
        <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
          {r.asset?.assetCode}
        </span>
      ),
    },
    {
      header: 'Asset Name',
      accessor: 'asset',
      render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-100">{r.asset?.name}</span>,
    },
    {
      header: 'User',
      accessor: 'user',
      render: (r) => <span>{r.user?.name}</span>,
    },
    {
      header: 'Check-out Date',
      accessor: 'checkoutTime',
      render: (r) => new Date(r.checkoutTime).toLocaleDateString(),
    },
    {
      header: 'Expected Return',
      accessor: 'expectedReturn',
      render: (r) => (
        <span
          className={
            r.status === 'Overdue' ||
            (r.status === 'CheckedOut' && r.expectedReturn && new Date(r.expectedReturn) < new Date())
              ? 'text-rose-600 font-bold'
              : ''
          }
        >
          {r.expectedReturn ? new Date(r.expectedReturn).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) =>
        r.status === 'CheckedOut' || r.status === 'Overdue' ? (
          <button
            onClick={() => {
              setCheckinItem(r);
              setCheckinModal(true);
            }}
            className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <HiCheck className="mr-1" /> Check In
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            Returned ({r.actualReturn ? new Date(r.actualReturn).toLocaleDateString() : '—'})
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Check-out & Return Station
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track user custody, return dates, overdue notices, and equipment return conditions
          </p>
        </div>

        <button
          onClick={() => {
            loadAvailableAssets();
            setNewCheckoutModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/30 transition self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4 mr-1.5" /> Check Out Equipment
        </button>
      </div>

      <DataTable
        columns={columns}
        data={checkouts}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchCheckouts(p)}
      />

      {/* New Checkout Modal */}
      <Modal
        isOpen={newCheckoutModal}
        onClose={() => setNewCheckoutModal(false)}
        title="Check Out Laboratory Equipment"
      >
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Select Available Asset *
            </label>
            <select
              required
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">Choose an equipment...</option>
              {availableAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} — {a.name} ({a.department?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Borrower Purpose
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Signal Processing Lab practical, research project"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Expected Return Date *
            </label>
            <input
              type="date"
              required
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setNewCheckoutModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-500 shadow-md shadow-primary-600/30"
            >
              Complete Check-out
            </button>
          </div>
        </form>
      </Modal>

      {/* Check In Modal */}
      <Modal
        isOpen={checkinModal}
        onClose={() => setCheckinModal(false)}
        title="Check In Equipment"
      >
        <form onSubmit={handleCheckinSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold block text-slate-800 dark:text-slate-200">
              {checkinItem?.asset?.name}
            </span>
            <span className="text-slate-400 font-mono">
              Tag: {checkinItem?.asset?.assetCode} • Borrower: {checkinItem?.user?.name}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Condition on Return
            </label>
            <select
              value={conditionOnReturn}
              onChange={(e) => setConditionOnReturn(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Good">Good (No damage, clean)</option>
              <option value="Fair">Fair (Slight wear, fully functional)</option>
              <option value="Poor">Poor (Degraded performance)</option>
              <option value="Damaged">Damaged (Requires maintenance inspection)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCheckinModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
            >
              Confirm Return & Check In
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

