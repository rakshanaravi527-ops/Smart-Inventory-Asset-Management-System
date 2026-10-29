import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(d) ? format(d, 'MMM dd, yyyy') : '—';
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(d) ? format(d, 'MMM dd, yyyy HH:mm') : '—';
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export const roleDisplayNames = {
  ADMIN: 'Admin',
  LAB_INCHARGE: 'Lab In-charge',
  STAFF: 'Staff',
  DEPT_HEAD: 'Department Head',
};

export function getRoleDisplay(role) {
  return roleDisplayNames[role] || role;
}

export const statusColors = {
  Available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  InUse: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  In_Use: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  UnderMaintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Under_Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Retired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Checked_Out: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Returned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function getStatusColor(status) {
  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export function formatStatus(status) {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
}

export const conditionOptions = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

export const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
];

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str, len = 40) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}
