'use client';

import React, { useEffect, useState } from 'react';
import { merchantService, EmployeeResponseData } from '@/services/merchantService';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  X,
  ShieldCheck,
  Search
} from 'lucide-react';

export default function TeamRosterPage() {
  const [members, setMembers] = useState<EmployeeResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<EmployeeResponseData | null>(null);
  const [search, setSearch] = useState('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CASHIER');
  
  // Edit form state
  const [editRole, setEditRole] = useState('CASHIER');
  const [editStatus, setEditStatus] = useState('ACTIVE');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await merchantService.getTeamMembers();
      setMembers(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!inviteEmail) {
      setError('Please provide a valid employee email.');
      return;
    }

    try {
      setSubmitting(true);
      await merchantService.inviteEmployee({
        email: inviteEmail,
        role: inviteRole
      });
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('CASHIER');
      fetchMembers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send team invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setError('');

    try {
      setSubmitting(true);
      await merchantService.updateEmployee(editMember.id, {
        role: editRole,
        status: editStatus
      });
      setEditMember(null);
      fetchMembers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update employee details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this employee from your merchant roster?')) {
      return;
    }
    try {
      setLoading(true);
      await merchantService.removeEmployee(id);
      fetchMembers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to remove employee.');
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const text = (m.fullName + m.email + m.role + m.status).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" /> Team & Employee Roster
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Delegate invoice creations, manager approvals, and cashier operations securely to your staff.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setInviteModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search team roster by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/5 focus:border-indigo-500/60 rounded-xl text-xs text-white outline-none placeholder-slate-600 transition-all"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="py-3 font-semibold">Employee Name</th>
                  <th className="py-3 font-semibold">Email Address</th>
                  <th className="py-3 font-semibold">Workspace Role</th>
                  <th className="py-3 font-semibold">Roster Status</th>
                  <th className="py-3 font-semibold">Invited Date</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <td className="py-4 font-bold text-slate-200">{m.fullName}</td>
                    <td className="py-4 text-slate-400">{m.email}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> {m.role}
                      </span>
                    </td>
                    <td className="py-4">
                      {m.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full font-semibold">
                          <XCircle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      {m.role === 'MERCHANT_OWNER' ? (
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Workspace Owner</span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditMember(m);
                              setEditRole(m.role);
                              setEditStatus(m.status);
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                            title="Edit Permissions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white rounded-lg transition-all"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium">
            No staff members registered in the team roster.
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Invite Team Member
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Enter the registered email of the user you wish to invite to join your merchant workspace.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Employee Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="employee@apexpay.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Assigned Workspace Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                >
                  <option value="MERCHANT_ADMIN">Admin (Full Control)</option>
                  <option value="MANAGER">Manager (Refund approvals, invoice logs)</option>
                  <option value="CASHIER">Cashier (Invoice generation, static QR view)</option>
                  <option value="VIEWER">Viewer (Read-only analytics)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inviting...
                    </>
                  ) : (
                    'Send Roster Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setEditMember(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" /> Edit Roster Permissions
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Update role parameters or suspend access for <span className="font-bold text-slate-200">{editMember.fullName}</span>.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Modify Assigned Role *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                >
                  <option value="MERCHANT_ADMIN">Admin (Full Control)</option>
                  <option value="MANAGER">Manager (Refund approvals, invoice logs)</option>
                  <option value="CASHIER">Cashier (Invoice generation, static QR view)</option>
                  <option value="VIEWER">Viewer (Read-only analytics)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Access Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl text-xs text-white outline-none transition-all"
                >
                  <option value="ACTIVE">Active (Grant Access)</option>
                  <option value="INACTIVE">Inactive (Suspend Access)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Permission Updates'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
