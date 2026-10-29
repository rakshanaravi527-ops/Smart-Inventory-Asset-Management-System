import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { get, post } from '../../api/client';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchFilter from '../../components/common/SearchFilter';
import { HiPlus, HiUpload, HiQrcode } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');

  // Dropdown options
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Import modal
  const [importModal, setImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'LAB_INCHARGE';
  const navigate = useNavigate();

  const fetchAssets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await get('/assets', {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        categoryId: category || undefined,
        departmentId: department || undefined,
      });

      setAssets(res.data?.data || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [search, status, category, department]);

  useEffect(() => {
    // Load categories & departments once
    get('/categories').then((r) => setCategories(r.data?.data || []));
    get('/departments').then((r) => setDepartments(r.data?.data || []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAssets]);

  const handleBulkImport = async () => {
    if (!csvText.trim()) {
      toast.error('Please paste CSV data');
      return;
    }

    setImporting(true);
    try {
      const res = await post('/assets/import', { csvData: csvText });
      toast.success(res.data?.message || 'Assets imported successfully');
      setImportModal(false);
      setCsvText('');
      fetchAssets(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      header: 'Asset Code',
      accessor: 'assetCode',
      render: (a) => (
        <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
          {a.assetCode}
        </span>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-100">{a.name}</div>
          <div className="text-xs text-slate-400">{a.serialNumber ? `SN: ${a.serialNumber}` : 'No serial number'}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (a) => <span className="text-xs font-medium">{a.category?.name}</span>,
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (a) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
          {a.department?.code}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      header: 'Condition',
      accessor: 'condition',
      render: (a) => <span className="text-xs font-medium">{a.condition}</span>,
    },
    {
      header: 'Location',
      accessor: 'location',
      render: (a) => (
        <span className="text-xs text-slate-500">
          {a.location ? `${a.location.name} (${a.location.room || ''})` : 'Unassigned'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Asset Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, search, inspect QR tags, and manage lifecycle events
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/scan"
            className="flex items-center px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <HiQrcode className="w-4 h-4 mr-1.5" /> Scan QR
          </Link>

          {canEdit && (
            <>
              <button
                onClick={() => setImportModal(true)}
                className="flex items-center px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <HiUpload className="w-4 h-4 mr-1.5" /> Bulk CSV
              </button>
              <Link
                to="/assets/new"
                className="flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white hover:bg-primary-500 shadow-md shadow-primary-600/30 transition"
              >
                <HiPlus className="w-4 h-4 mr-1.5" /> Add Asset
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
        department={department}
        onDepartmentChange={setDepartment}
        categories={categories}
        departments={departments}
        onReset={() => {
          setSearch('');
          setStatus('');
          setCategory('');
          setDepartment('');
        }}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={assets}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchAssets(p)}
        onRowClick={(asset) => navigate(`/assets/${asset.id}`)}
      />

      {/* Bulk CSV Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Bulk Import Assets via CSV
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste CSV text with columns: <code>name, categoryId, departmentId, serialNumber, cost, vendor</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,categoryId,departmentId,serialNumber,cost,vendor&#10;Dell Monitor,uuid-cat,uuid-dept,SN123,250,Dell"
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
            />

            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setImportModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleBulkImport}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Upload & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

