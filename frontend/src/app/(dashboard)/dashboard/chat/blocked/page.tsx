'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, UserCheck } from 'lucide-react';
import { chatService, BlockedUserDTO } from '@/services/chatService';

export default function BlockedUsersPage() {
  const [blockedList, setBlockedList] = useState<BlockedUserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = async () => {
    setLoading(true);
    try {
      const data = await chatService.getBlockedUsers();
      setBlockedList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (blockedUserId: string) => {
    try {
      await chatService.unblockUser(blockedUserId);
      fetchBlocked();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/chat" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>Blocked Users</span>
          </h2>
          <p className="text-xs text-slate-400">Manage accounts blocked from contacting you</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading blocked users...</div>
        ) : blockedList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No blocked users found.</div>
        ) : (
          blockedList.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                  {item.blockedUserName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{item.blockedUserName}</h4>
                  <p className="text-xs text-slate-400">Reason: {item.reason || 'None specified'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUnblock(item.blockedUserId)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/30 transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Unblock</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
