'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, CheckSquare, History } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const getNotificationIconColor = (type: string) => {
    if (type.includes('SUCCESS') || type.includes('LINKED') || type.includes('ACCEPTED')) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
    }
    if (type.includes('FAILED') || type.includes('REJECTED')) {
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
    }
    if (type.includes('ALERT')) {
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
    }
    return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25';
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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all focus:outline-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-[10px] font-extrabold flex items-center justify-center border-2 border-slate-950 text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-out barrier */}
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-40"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-3">
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none">
                      {unreadCount} New
                    </span>
                  )}
                </span>
                
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800/40 flex items-center justify-center mb-3">
                      <Bell className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">All quiet here!</p>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">You will receive real-time payment and bank account alerts here.</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      className={`group flex items-start gap-3 p-3 rounded-xl transition-all border ${
                        item.read 
                          ? 'bg-slate-950/20 border-transparent hover:bg-slate-950/45' 
                          : 'bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10'
                      }`}
                    >
                      {/* Icon Indicator */}
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${getNotificationIconColor(item.notificationType)}`}>
                        <Bell className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${item.read ? 'text-slate-300' : 'text-white'}`}>
                            {item.title}
                          </p>
                          <span className="text-[9px] text-slate-500 shrink-0 font-medium whitespace-nowrap">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed break-words font-medium">
                          {item.message}
                        </p>
                        
                        {!item.read && (
                          <button 
                            onClick={() => markAsRead(item.id)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold mt-2 flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View All Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-white/5 pt-3.5 mt-3">
                  <Link 
                    href="/dashboard/notifications"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/5 hover:border-white/10 hover:bg-slate-900 transition-all text-xs font-bold text-slate-300 hover:text-white"
                  >
                    <History className="w-3.5 h-3.5" /> View Notification History
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
