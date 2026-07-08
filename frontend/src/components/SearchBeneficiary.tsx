'use client';

import React, { useState, useEffect } from 'react';
import { useBeneficiariesQuery, useSearchPlatformUsersQuery, useBeneficiary } from '@/hooks/useBeneficiary';
import { Search, UserPlus, CheckCircle, Loader2, Contact, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBeneficiaryProps {
  onSelect: (recipient: { identifier: string; name: string; walletNumber: string }) => void;
}

export function SearchBeneficiary({ onSelect }: SearchBeneficiaryProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showPlatformResults, setShowPlatformResults] = useState(false);

  const { data: contacts, isLoading: contactsLoading } = useBeneficiariesQuery();
  const { data: platformUsers, isLoading: platformLoading } = useSearchPlatformUsersQuery(
    debouncedQuery,
    showPlatformResults
  );
  const { addBeneficiary, isAdding, addResponse } = useBeneficiary();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim().length >= 2) {
        setShowPlatformResults(true);
      } else {
        setShowPlatformResults(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  const handleAddBeneficiary = async (identifier: string, name: string) => {
    try {
      await addBeneficiary({ recipientIdentifier: identifier, nickname: name });
    } catch (e) {
      console.error(e);
    }
  };

  // Filter contacts locally
  const filteredContacts = contacts?.filter((c) =>
    c.fullName.toLowerCase().includes(query.toLowerCase()) ||
    c.nickname.toLowerCase().includes(query.toLowerCase()) ||
    c.upiId.toLowerCase().includes(query.toLowerCase()) ||
    c.walletNumber.includes(query)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, @username, email, or mobile..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
        />
        {(platformLoading || isAdding) && (
          <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-indigo-500" />
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {/* Platform Search Results */}
        {showPlatformResults && (
          <div className="space-y-2">
            <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Global Users Search</h4>
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
              {platformLoading ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Searching network...
                </div>
              ) : !platformUsers || platformUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No users found on the network matching query.</div>
              ) : (
                platformUsers.map((user) => {
                  const isSaved = contacts?.some((c) => c.recipientUserId === user.id);
                  return (
                    <div key={user.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div 
                        onClick={() => onSelect({ identifier: user.username, name: user.fullName, walletNumber: '' })}
                        className="flex items-center gap-3.5 cursor-pointer flex-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{user.fullName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">@{user.username}</div>
                        </div>
                      </div>
                      
                      {!isSaved ? (
                        <button
                          onClick={() => handleAddBeneficiary(user.username, user.fullName)}
                          disabled={isAdding}
                          className="flex items-center gap-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-xl font-bold cursor-pointer hover:bg-indigo-650 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" /> Saved
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Saved Beneficiaries */}
        <div className="space-y-2">
          <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {query.trim().length > 0 ? 'Matching Contacts' : 'Saved Contacts'}
          </h4>
          
          {contactsLoading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto mb-2" />
              <span className="text-xs">Loading contact list...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="bg-slate-900/10 border border-dashed border-white/5 rounded-2xl p-8 text-center text-xs text-slate-500">
              {query.trim().length > 0 ? 'No matching contacts found.' : 'No saved contacts yet. Search above to add peer contacts.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  whileHover={{ y: -2 }}
                  onClick={() => onSelect({ identifier: contact.walletNumber || contact.upiId.split('@')[0], name: contact.fullName, walletNumber: contact.walletNumber })}
                  className="bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-indigo-400 font-bold">
                    {contact.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{contact.fullName}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{contact.upiId}</div>
                  </div>
                  <Contact className="w-4 h-4 text-slate-500 shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
