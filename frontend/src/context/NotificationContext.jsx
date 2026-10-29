import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await get('/notifications', { unread: true, limit: 1 });
      const data = res.data;
      if (data?.totalCount !== undefined) {
        setUnreadCount(data.totalCount);
      } else if (data?.data) {
        const items = Array.isArray(data.data) ? data.data : [];
        setUnreadCount(data.unreadCount ?? items.length);
      }
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNotifications]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
