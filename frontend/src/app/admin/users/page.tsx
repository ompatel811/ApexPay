'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Search,
  UserCheck,
  UserX,
  Trash2,
  KeyRound,
  Eye,
  RefreshCw,
  Clock,
  ShieldAlert,
  X
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Dialog/Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'activate' | 'delete';
    userId: string | null;
  }>({ isOpen: false, type: 'suspend', userId: null });

  const [pwResetState, setPwResetState] = useState<{
    isOpen: boolean;
    userId: string | null;
    password: '';
  }>({ isOpen: false, userId: null, password: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async () => {
    const { type, userId } = confirmState;
    if (!userId) return;

    try {
      if (type === 'suspend') {
        await adminService.suspendUser(userId);
      } else if (type === 'activate') {
        await adminService.activateUser(userId);
      } else if (type === 'delete') {
        await adminService.deleteUser(userId);
      }
      fetchUsers();
    } catch (err: any) {
      console.error(err);
    } finally {
      setConfirmState({ isOpen: false, type: 'suspend', userId: null });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwResetState.userId || !pwResetState.password) return;

    try {
      await adminService.resetUserPassword(pwResetState.userId, pwResetState.password);
      alert('Password reset completed successfully.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setPwResetState({ isOpen: false, userId: null, password: '' });
    }
  };

  const viewDetails = async (user: any) => {
    setSelectedUser(user);
    setDetailsOpen(true);
    try {
      setLogsLoading(true);
      const logs = await adminService.getUserActivity(user.id);
      setActivityLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.mobileNumber.includes(search);

    const matchesStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-50 tracking-tight">User Account Control</h2>
          <p className="text-sm text-slate-400">Suspend, activate, delete, and inspect client profile audit logs</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by full name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-450">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Fetching user ledger records...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-450">No users found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Mobile</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{user.fullName}</span>
                        <span className="text-xs text-indigo-400">@{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300 font-mono text-xs">{user.mobileNumber}</td>
                    <td className="py-3.5 px-6 text-slate-300 text-xs">{user.email}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          user.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : user.accountStatus === 'SUSPENDED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewDetails(user)}
                          title="View Profile Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {user.accountStatus === 'ACTIVE' ? (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'suspend', userId: user.id })
                            }
                            title="Suspend User"
                            className="p-1.5 rounded-lg bg-amber-650/10 hover:bg-amber-600 text-amber-500 hover:text-white transition-colors"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmState({ isOpen: true, type: 'activate', userId: user.id })
                            }
                            title="Activate User"
                            className="p-1.5 rounded-lg bg-emerald-650/10 hover:bg-emerald-600 text-emerald-500 hover:text-white transition-colors"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setPwResetState({ isOpen: true, userId: user.id, password: '' })}
                          title="Force Reset Password"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-650 text-indigo-400 hover:text-white transition-colors"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmState({ isOpen: true, type: 'delete', userId: user.id })
                          }
                          title="Hard Delete Account"
                          className="p-1.5 rounded-lg bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: 'suspend', userId: null })}
        onConfirm={handleAction}
        title={
          confirmState.type === 'delete'
            ? 'Delete User Account Permanently?'
            : confirmState.type === 'suspend'
            ? 'Suspend User Account?'
            : 'Reactivate User Account?'
        }
        message={
          confirmState.type === 'delete'
            ? 'WARNING: This is a destructive action that deletes the customer user record and their digital wallet permanently.'
            : confirmState.type === 'suspend'
            ? 'This suspends wallet transactions, balance checkouts, and logins for this user immediately.'
            : 'This reactivates and enables normal wallet transaction operations for this user.'
        }
        isDanger={confirmState.type === 'delete' || confirmState.type === 'suspend'}
        confirmText={
          confirmState.type === 'delete' ? 'Delete' : confirmState.type === 'suspend' ? 'Suspend' : 'Activate'
        }
      />

      {/* Reset Password Modal */}
      {pwResetState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-400" />
              <span>Force Reset User Password</span>
            </h3>
            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">New Password String</label>
                <input
                  type="password"
                  placeholder="Input secure replacement password"
                  value={pwResetState.password}
                  onChange={(e: any) => setPwResetState({ ...pwResetState, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPwResetState({ isOpen: false, userId: null, password: '' })}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-850 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details & Activity Audit Logs Modal */}
      {detailsOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex flex-col text-left">
                <h3 className="text-lg font-bold text-slate-50">{selectedUser.fullName}</h3>
                <span className="text-xs text-indigo-400">UUID: {selectedUser.id}</span>
              </div>
              <button onClick={() => setDetailsOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-left">
              <div>
                <span className="text-xs text-slate-500 block">Username</span>
                <span className="font-semibold text-slate-200">@{selectedUser.username}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Mobile Number</span>
                <span className="font-semibold text-slate-200 font-mono">{selectedUser.mobileNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-200">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Verification status</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedUser.accountStatus?.replace('_', ' ').toLowerCase()}</span>
              </div>
            </div>

            {/* Logs Area */}
            <div className="mt-6 border-t border-slate-800 pt-4 text-left">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Security Activity Audit Timeline</span>
              </h4>

              {logsLoading ? (
                <div className="text-xs text-slate-450 p-4 text-center">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto text-indigo-400 mb-1" />
                  <span>Loading timeline logs...</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-xs text-slate-500 p-4 text-center">No activity logged for this user.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 flex justify-between items-center text-xs font-mono text-slate-300"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-500">Performed by: {log.performedBy || 'SYSTEM'}</span>
                      </div>
                      <span className="text-[10px] text-slate-450">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
