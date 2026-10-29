import React, { useState, useEffect, useCallback } from 'react';
import { get, post } from '../../api/client';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiPlus, HiOfficeBuilding } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/departments');
      setDepartments(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/departments', { name, code });
      toast.success('Department created');
      setModalOpen(false);
      setName('');
      setCode('');
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    }
  };

  const columns = [
    {
      header: 'Department Code',
      accessor: 'code',
      render: (d) => (
        <span className="font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">
          {d.code}
        </span>
      ),
    },
    {
      header: 'Department Name',
      accessor: 'name',
      render: (d) => <span className="font-semibold text-slate-800 dark:text-slate-100">{d.name}</span>,
    },
    {
      header: 'Created On',
      accessor: 'createdAt',
      render: (d) => new Date(d.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Academic & Operational Departments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional branches, laboratory locations, and asset allocation scopes
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-500 shadow-md shadow-primary-600/30 transition self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4 mr-1.5" /> Add Department
        </button>
      </div>

      <DataTable columns={columns} data={departments} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Department">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mechanical Engineering"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Department Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MECH"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

