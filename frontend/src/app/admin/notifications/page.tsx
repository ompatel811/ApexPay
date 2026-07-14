'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Bell,
  Send,
  Trash2,
  Users,
  User,
  Megaphone,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Announcement form state
  const [form, setForm] = useState({
    userId: '',
    title: '',
    message: '',
    notificationType: 'SYSTEM_NOTIFICATION',
    scheduledTime: '',
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    notificationId: string | null;
  }>({ isOpen: false, notificationId: null });

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      setError('Please provide title and message content.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        userId: form.userId ? form.userId : null,
        title: form.title,
        message: form.message,
        notificationType: form.notificationType,
        scheduledTime: form.scheduledTime || undefined,
      };

      await adminService.sendNotification(payload);
      
      // Reset title and message
      setForm({
        ...form,
        title: '',
        message: '',
        scheduledTime: '',
      });
      alert('Notification announcement dispatched successfully.');
    } catch (err: any) {
      console.error(err);
      setError('Failed to dispatch announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="text-left">
        <h2 className="text-xl font-black text-slate-50 tracking-tight">Announcements Control</h2>
        <p className="text-sm text-slate-400">Dispatch system-wide alerts, broadcast push frames, or notify individual users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatches control panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md text-left">
          <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Send className="h-4 w-4 text-indigo-400" />
            <span>Create Broadcast Alert</span>
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-400 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Target Audience</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                  <option value="">Broadcast to All Users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      Direct: {u.fullName} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* Alert Type */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Alert Classification</label>
                <select
                  value={form.notificationType}
                  onChange={(e) => setForm({ ...form, notificationType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                >
                  <option value="SYSTEM_NOTIFICATION">System Announcement</option>
                  <option value="SECURITY_ALERT">Security Alert / Warn</option>
                  <option value="PAYMENT_RECEIVED">General Credit Information</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Announcement Title</label>
              <input
                type="text"
                placeholder="Platform Maintenance Notice"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Notification Message Body</label>
              <textarea
                placeholder="Write the message text details here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                required
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Schedule Dispatch (Optional simulation)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Dispatch */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-650/10 hover:shadow-indigo-650/20 transition-all duration-200"
              >
                <Megaphone className="h-4 w-4" />
                <span>{form.scheduledTime ? 'Schedule Alert' : 'Send Immediately'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tip panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col text-left justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-indigo-400" />
              <span>Guidelines</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatched announcements trigger real-time notifications on the client dashboards via WebSocket listeners.
            </p>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 space-y-2 text-xs font-mono">
              <div className="flex gap-2 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                <span>System updates go to all.</span>
              </div>
              <div className="flex gap-2 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5"></span>
                <span>Security alerts flag logins.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
