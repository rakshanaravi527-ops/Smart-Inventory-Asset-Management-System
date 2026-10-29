import React, { useState, useEffect, useCallback } from 'react';
import { get, post, patch, del } from '../../api/client';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiPlus, HiUserAdd, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
    departmentId: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([get('/users'), get('/departments')]);
      setUsers(uRes.data?.data || []);
      setDepartments(dRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/users', formData);
      toast.success('User account created');
      setModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'STAFF', departmentId: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await patch(`/users/${userId}`, { active: !currentActive });
      toast.success('User status updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 block">{u.name}</span>
          <span className="text-xs text-slate-400">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'System Role',
      accessor: 'role',
      render: (u) => (
        <span className="font-semibold text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
          {u.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (u) => <span className="text-xs">{u.department?.name || 'Unassigned'}</span>,
    },
    {
      header: 'Status',
      accessor: 'active',
      render: (u) => (
        <button
          onClick={() => handleToggleActive(u.id, u.active)}
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            u.active
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {u.active ? 'Active' : 'Disabled'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            User Accounts & Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage institutional users, department heads, store managers, and system administrators
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-500 shadow-md shadow-primary-600/30 transition self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4 mr-1.5" /> Add New User
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} />

      {/* Add User Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create User Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="ADMIN">System Administrator</option>
              <option value="LAB_INCHARGE">Lab Incharge / Store Manager</option>
              <option value="STAFF">Faculty / Student Scholar</option>
              <option value="DEPT_HEAD">Department Head (Read-only)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Assigned Department
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">None / Campus-wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

