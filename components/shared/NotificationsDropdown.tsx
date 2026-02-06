'use client';

import { Bell, Package, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  title: string;
  message: string;
  time: string;
  read: boolean;
  created_at: string;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      // Fetch from both compliance_alerts and activities
      const [alertsRes, activitiesRes] = await Promise.all([
        supabase.from('compliance_alerts').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const alerts = (alertsRes.data || []).map(a => ({
        id: a.id,
        type: (a.severity === 'error' ? 'urgent' : a.severity === 'warning' ? 'warning' : 'info') as any,
        title: a.title,
        message: a.description,
        time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
        read: false,
        created_at: a.created_at
      }));

      const activities = (activitiesRes.data || []).map(act => ({
        id: act.id,
        type: 'info' as any,
        title: act.event,
        message: `Activity type: ${act.type}`,
        time: formatDistanceToNow(new Date(act.created_at), { addSuffix: true }),
        read: false,
        created_at: act.created_at
      }));

      // Merge and sort
      const merged = [...alerts, ...activities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setNotifications(merged);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('public-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'compliance_alerts' }, (payload) => {
        const newAlert = payload.new;

        // Show toast
        if (newAlert.severity === 'error' || newAlert.severity === 'warning') {
          toast.warning(`Compliance Alert: ${newAlert.title}`, {
            description: newAlert.description,
          });
        } else {
          toast.info(newAlert.title);
        }

        setNotifications(prev => [
          {
            id: newAlert.id,
            type: (newAlert.severity === 'error' ? 'urgent' : newAlert.severity === 'warning' ? 'warning' : 'info') as any,
            title: newAlert.title,
            message: newAlert.description,
            time: 'Just now',
            read: false,
            created_at: newAlert.created_at
          },
          ...prev
        ].slice(0, 10));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, (payload) => {
        const newAct = payload.new;

        // Only show toast for important activity types
        if (newAct.type === 'procurement' || newAct.type === 'alert') {
          toast.success(newAct.event);
        }

        setNotifications(prev => [
          {
            id: newAct.id,
            type: 'info' as any,
            title: newAct.event,
            message: `Activity type: ${newAct.type}`,
            time: 'Just now',
            read: false,
            created_at: newAct.created_at
          },
          ...prev
        ].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Package className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50';
    switch (type) {
      case 'urgent':
        return 'bg-red-50';
      case 'success':
        return 'bg-green-50';
      case 'warning':
        return 'bg-amber-50';
      default:
        return 'bg-blue-50';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:right-0 left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <span className="text-xs uppercase font-bold tracking-widest">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 text-sm">
                No notifications found
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${getNotificationBg(notification.type, notification.read)
                      }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1.5"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <button className="w-full text-center text-xs text-purple-600 hover:text-purple-700 font-bold uppercase tracking-widest">
              View all compliance alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
