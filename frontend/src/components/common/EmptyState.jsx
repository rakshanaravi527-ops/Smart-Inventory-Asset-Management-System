import React from 'react';
import { HiOutlineFolderOpen } from 'react-icons/hi';

export default function EmptyState({
  title = 'No Data Found',
  description = 'There are no items matching your criteria.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 text-2xl">
        <HiOutlineFolderOpen />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

