import React from 'react';
import Modal from './Modal';
import { HiExclamation } from 'react-icons/hi';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start space-x-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
            danger
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
          }`}
        >
          <HiExclamation />
        </div>
        <div className="flex-1 text-sm text-slate-600 dark:text-slate-300 pt-1">
          {message}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-3">
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition ${
            danger
              ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
              : 'bg-primary-600 hover:bg-primary-700 disabled:opacity-50'
          }`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}

