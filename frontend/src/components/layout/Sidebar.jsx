import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiHome,
  HiCube,
  HiQrcode,
  HiClipboardCheck,
  HiCollection,
  HiCog,
  HiDocumentReport,
  HiUsers,
  HiOfficeBuilding,
  HiBell,
  HiX,
} from 'react-icons/hi';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: HiHome },
    { to: '/assets', label: 'Asset Registry', icon: HiCube },
    { to: '/scan', label: 'Scan QR / Barcode', icon: HiQrcode },
    { to: '/checkout', label: 'Check-out / In', icon: HiClipboardCheck },
    { to: '/stock', label: 'Stock & Consumables', icon: HiCollection },
    { to: '/maintenance', label: 'Maintenance Hub', icon: HiCog },
    { to: '/reports', label: 'Reports & Audits', icon: HiDocumentReport },
    { to: '/notifications', label: 'Notifications', icon: HiBell },
  ];

  const adminItems = [
    { to: '/users', label: 'User Management', icon: HiUsers },
    { to: '/departments', label: 'Departments & Labs', icon: HiOfficeBuilding },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 font-black text-sm">
              SI
            </div>
            <span className="font-bold text-white text-base tracking-tight">SmartAsset</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2">
              Main Operations
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <p className="px-3 text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2">
                Administration
              </p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500 flex flex-col">
          <span className="font-semibold text-slate-400">Institutional Edition</span>
          <span>v1.0 • College Assets</span>
        </div>
      </aside>
    </>
  );
}
