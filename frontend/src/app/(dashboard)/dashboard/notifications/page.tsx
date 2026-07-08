'use client';

import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { 
  Bell, 
  Trash2, 
  Check, 
  CheckSquare, 
  Mail, 
  Chrome, 
  Volume2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenterPage() {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationStore();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  
  // Mock Settings Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  useEffect(() => {
    fetchNotifications();
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [fetchNotifications]);

  const requestBrowserPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    
    Notification.requestPermission().then((permission) => {
      setBrowserPermission(permission);
      if (permission === 'granted') {
        new Notification('ApexPay Notifications', {
          body: 'Browser push notifications have been enabled successfully!',
          icon: '/favicon.ico',
        });
      }
    });
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('SUCCESS') || type.includes('LINKED') || type.includes('ACCEPTED')) {
      return {
        icon: CheckCircle2,
        color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      };
    }
    if (type.includes('FAILED') || type.includes('REJECTED')) {
      return {
        icon: AlertCircle,
        color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      };
    }
    if (type.includes('ALERT')) {
      return {
        icon: ShieldAlert,
        color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      };
    }
    return {
      icon: Bell,
      color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    };
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredList = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.read;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notification Center</h1>
          <p className="text-slate-400 text-xs mt-1">Review transaction alerts, safety flags, and toggle delivery preferences.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 p-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-900/80 border border-white/5 hover:border-white/10 text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-all self-start cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Notifications History list */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <button
              onClick={() => setFilter('ALL')}
              className={`p-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === 'ALL' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`p-1.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'UNREAD' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="text-[10px] bg-slate-950/45 px-1.5 py-0.5 rounded-full text-indigo-300 leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {filteredList.length === 0 ? (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-500 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">No Notifications Found</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
                  You are all caught up! Real-time alerts regarding wallet, banks, and UPI transactions will appear here.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredList.map((item) => {
                  const style = getNotificationIcon(item.notificationType);
                  const Icon = style.icon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className={`group flex items-start gap-4 p-4 rounded-2xl border bg-slate-900 transition-all ${
                        item.read 
                          ? 'border-white/5 hover:border-white/10 bg-slate-900/60' 
                          : 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${style.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className={`text-xs font-bold leading-normal ${item.read ? 'text-slate-300' : 'text-white'}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap shrink-0 mt-0.5">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words font-medium">
                          {item.message}
                        </p>
                        
                        {!item.read && (
                          <button
                            onClick={() => markAsRead(item.id)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold mt-2.5 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark read
                          </button>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => deleteNotification(item.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right column: Notification Settings */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Settings panel */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4.5 flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-indigo-400" /> Preference Configuration
            </h3>

            <div className="space-y-4">
              {/* Browser Push alerts */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-950/20 border border-white/5">
                <div className="flex items-start gap-3">
                  <Chrome className="w-4.5 h-4.5 text-indigo-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Browser Push Alerts</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Send desktop notifications in real time.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-white/10 rounded accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Email alerts */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-950/20 border border-white/5">
                <div className="flex items-start gap-3">
                  <Mail className="w-4.5 h-4.5 text-emerald-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Email Confirmation</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Receive receipts and alerts via email address.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-white/10 rounded accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Sound alert */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-950/20 border border-white/5">
                <div className="flex items-start gap-3">
                  <Volume2 className="w-4.5 h-4.5 text-amber-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Sound Notifications</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Play audio cues for incoming payment items.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-white/10 rounded accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Browser System Permission Request */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">System Permissions</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Enable browser level API notifications to get alerts when you are in other tabs or minimized.
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <span className={`text-[10px] font-extrabold capitalize ${
                  browserPermission === 'granted' 
                    ? 'text-emerald-400' 
                    : browserPermission === 'denied' 
                    ? 'text-rose-400' 
                    : 'text-amber-400'
                }`}>
                  {browserPermission}
                </span>
              </div>
              
              {browserPermission !== 'granted' && (
                <button
                  onClick={requestBrowserPermission}
                  className="p-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-[10px] rounded-lg transition-all text-white cursor-pointer"
                >
                  Enable Banners
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
