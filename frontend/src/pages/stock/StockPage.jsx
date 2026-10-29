import React, { useEffect, useState, useCallback } from 'react';
import { get, patch } from '../../api/client';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiExclamation, HiPlus, HiMinus, HiCollection } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function StockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'LAB_INCHARGE';

  const loadStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/reports/stock');
      setItems(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load consumable stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const handleAdjustQuantity = async (assetCode, delta) => {
    try {
      // Find the asset ID
      const assetRes = await get('/assets', { search: assetCode });
      const asset = assetRes.data?.data?.[0];
      if (!asset) return;

      const newQty = Math.max(0, (asset.quantity ?? 0) + delta);
      await patch(`/assets/${asset.id}`, { quantity: newQty });

      toast.success(`Updated ${asset.name} stock to ${newQty}`);
      loadStock();
    } catch (err) {
      toast.error('Failed to update stock quantity');
    }
  };

  const columns = [
    {
      header: 'Asset Code',
      accessor: 'assetCode',
      render: (r) => (
        <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
          {r.assetCode}
        </span>
      ),
    },
    {
      header: 'Item Name',
      accessor: 'name',
      render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-100">{r.name}</span>,
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (r) => <span className="text-xs font-medium">{r.department}</span>,
    },
    {
      header: 'Location / Store',
      accessor: 'location',
      render: (r) => <span className="text-xs text-slate-500">{r.location}</span>,
    },
    {
      header: 'Current Stock',
      accessor: 'quantity',
      render: (r) => (
        <div className="flex items-center space-x-2">
          <span className="font-bold text-base text-slate-900 dark:text-white">{r.quantity}</span>
          {canEdit && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleAdjustQuantity(r.assetCode, -1)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200"
                title="Decrease 1"
              >
                <HiMinus />
              </button>
              <button
                onClick={() => handleAdjustQuantity(r.assetCode, 1)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200"
                title="Increase 1"
              >
                <HiPlus />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Min Threshold',
      accessor: 'minThreshold',
      render: (r) => <span className="text-xs text-slate-400 font-medium">{r.minThreshold}</span>,
    },
    {
      header: 'Max Level',
      accessor: 'maxLevel',
      render: (r) => <span className="text-xs text-slate-400 font-medium">{r.maxLevel}</span>,
    },
    {
      header: 'Inventory Status',
      accessor: 'stockStatus',
      render: (r) => {
        if (r.stockStatus === 'Low Stock') {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
              <HiExclamation className="mr-1 text-sm" /> Low Stock
            </span>
          );
        }
        if (r.stockStatus === 'Excess Stock') {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Excess Stock
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Normal
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Stock & Consumables Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time levels of lab reagents, glassware, and wiring with automated reorder thresholds
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  );
}

