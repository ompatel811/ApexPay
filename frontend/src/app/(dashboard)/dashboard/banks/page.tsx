'use client';

import React, { useState } from 'react';
import { useBankAccount } from '@/hooks/useBankAccount';
import { CreditCard, Landmark, Check, AlertCircle, PlusCircle, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BankAccountsPage() {
  const { 
    useBankAccountsQuery, 
    useLinkBankAccountMutation, 
    useSetPrimaryBankAccountMutation, 
    useDeleteBankAccountMutation 
  } = useBankAccount();

  const { data: bankAccounts = [], isLoading, error } = useBankAccountsQuery();
  const linkBankAccount = useLinkBankAccountMutation();
  const setPrimary = useSetPrimaryBankAccountMutation();
  const deleteBank = useDeleteBankAccountMutation();

  const [isAdding, setIsAdding] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!bankName || !accountHolderName || !accountNumber || !ifsc || !branch) {
      setValidationError('All fields are required.');
      return;
    }

    if (!/^\d{9,18}$/.test(accountNumber)) {
      setValidationError('Account number must be between 9 and 18 digits.');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      setValidationError('Invalid IFSC code format (e.g. SBIN0001234).');
      return;
    }

    linkBankAccount.mutate(
      { bankName, accountHolderName, accountNumber, ifsc, branch, accountType },
      {
        onSuccess: () => {
          setIsAdding(false);
          setBankName('');
          setAccountHolderName('');
          setAccountNumber('');
          setIfsc('');
          setBranch('');
          setAccountType('SAVINGS');
        },
        onError: (err: any) => {
          setValidationError(err.response?.data?.message || 'Failed to link bank account. Please try again.');
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bank Accounts</h1>
          <p className="text-slate-400 text-xs mt-1">Link and manage external bank accounts to perform UPI transactions.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 p-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs transition-all shadow-lg shadow-indigo-600/15 text-white cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Link Bank Account
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          /* Add Bank Account Panel */
          <motion.div
            key="add-bank-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Link New Bank Account</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Please provide correct details of your external bank account.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setValidationError('');
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Account Number</label>
                  <input
                    type="password"
                    placeholder="e.g. 12345678901"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* IFSC Code */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Connaught Place, New Delhi"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Account Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as 'SAVINGS' | 'CURRENT')}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={linkBankAccount.isPending}
                  className="flex items-center justify-center gap-2 p-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 font-bold text-xs text-white transition-all cursor-pointer"
                >
                  {linkBankAccount.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying with Bank...
                    </>
                  ) : (
                    'Link Bank Account'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Bank Accounts List Grid */
          <motion.div
            key="bank-list-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {isLoading ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-slate-500 text-xs">Retrieving linked bank accounts...</p>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-500 flex items-center justify-center mb-4">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-sm">No Bank Accounts Linked</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
                  You need to link at least one bank account to set up your UPI IDs and authorize transfer payments.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-5 p-2 px-5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl transition-all text-white cursor-pointer"
                >
                  Link Your First Bank Account
                </button>
              </div>
            ) : (
              bankAccounts.map((account) => (
                <motion.div
                  key={account.id}
                  layout
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between h-48 transition-all hover:border-white/10 ${
                    account.isPrimary ? 'border-indigo-500/40' : 'border-white/5'
                  }`}
                >
                  {/* Card Background Accent */}
                  {account.isPrimary && (
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
                  )}

                  {/* Top Line */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        account.isPrimary ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800/45 text-slate-400'
                      }`}>
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{account.bankName}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{account.branch}</p>
                      </div>
                    </div>

                    {account.isPrimary && (
                      <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Account Middle details */}
                  <div className="my-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Number</p>
                    <p className="text-sm font-semibold tracking-wider text-slate-200 mt-1">{account.maskedAccountNumber}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">IFSC</span>
                        <p className="text-[10px] font-semibold text-slate-300">{account.ifsc}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Type</span>
                        <p className="text-[10px] font-semibold text-slate-300 uppercase">{account.accountType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase">
                      {account.verificationStatus}
                    </span>

                    <div className="flex items-center gap-2">
                      {!account.isPrimary && (
                        <button
                          onClick={() => setPrimary.mutate(account.id)}
                          disabled={setPrimary.isPending}
                          className="p-1.5 px-3 rounded-lg bg-slate-950 border border-white/5 hover:border-white/10 hover:bg-slate-900 transition-all text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          {setPrimary.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Set Primary
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to unlink this bank account?')) {
                            deleteBank.mutate(account.id);
                          }
                        }}
                        disabled={deleteBank.isPending}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                        title="Remove Bank"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
