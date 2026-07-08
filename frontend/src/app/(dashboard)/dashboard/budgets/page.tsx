'use client';

import React, { useState } from 'react';
import { useBudget } from '@/hooks/useBudget';
import { 
  PlusCircle, Trash2, CheckCircle2, AlertCircle, Edit, Calendar, DollarSign,
  TrendingUp, Sliders, Loader2, ArrowRight, Check, X, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'FOOD', 'SHOPPING', 'TRAVEL', 'RECHARGE', 'UTILITIES', 
  'BILLS', 'MEDICAL', 'EDUCATION', 'INVESTMENT', 'ENTERTAINMENT', 
  'SALARY', 'TRANSFER', 'OTHER'
];

export default function BudgetsAndGoalsPage() {
  const {
    useBudgetsQuery,
    useCreateBudgetMutation,
    useUpdateBudgetMutation,
    useDeleteBudgetMutation,
    useGoalsQuery,
    useCreateGoalMutation,
    useUpdateGoalMutation,
    useDeleteGoalMutation,
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'GOALS'>('BUDGETS');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetsQuery(selectedMonth);
  const { data: goals = [], isLoading: goalsLoading } = useGoalsQuery();

  const createBudget = useCreateBudgetMutation();
  const updateBudget = useUpdateBudgetMutation();
  const deleteBudget = useDeleteBudgetMutation();

  const createGoal = useCreateGoalMutation();
  const updateGoal = useUpdateGoalMutation();
  const deleteGoal = useDeleteGoalMutation();

  // Budget Modal/Form State
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetCategory, setBudgetCategory] = useState('FOOD');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(selectedMonth);
  const [budgetError, setBudgetError] = useState('');

  // Goal Modal/Form State
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalError, setGoalError] = useState('');

  // Increment goal savings progress inline
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetError('');

    const limit = parseFloat(budgetLimit);
    if (isNaN(limit) || limit <= 0) {
      setBudgetError('Please enter a valid limit amount.');
      return;
    }

    if (editingBudgetId) {
      updateBudget.mutate(
        { id: editingBudgetId, category: budgetCategory, amountLimit: limit, month: budgetMonth },
        {
          onSuccess: () => {
            setIsAddingBudget(false);
            setEditingBudgetId(null);
            setBudgetLimit('');
          },
          onError: (err: any) => {
            setBudgetError(err.response?.data?.message || 'Failed to update budget.');
          }
        }
      );
    } else {
      createBudget.mutate(
        { category: budgetCategory, amountLimit: limit, month: budgetMonth },
        {
          onSuccess: () => {
            setIsAddingBudget(false);
            setBudgetLimit('');
          },
          onError: (err: any) => {
            setBudgetError(err.response?.data?.message || 'Failed to create budget. Try editing the category instead.');
          }
        }
      );
    }
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoalError('');

    const target = parseFloat(goalTargetAmount);
    const current = parseFloat(goalCurrentAmount || '0');
    
    if (!goalName.trim()) {
      setGoalError('Please enter a goal name.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      setGoalError('Please enter a valid target savings amount.');
      return;
    }
    if (!goalTargetDate) {
      setGoalError('Please select a target completion date.');
      return;
    }

    const payload = {
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: goalTargetDate
    };

    if (editingGoalId) {
      updateGoal.mutate(
        { id: editingGoalId, ...payload },
        {
          onSuccess: () => {
            setIsAddingGoal(false);
            setEditingGoalId(null);
            resetGoalForm();
          },
          onError: (err: any) => {
            setGoalError(err.response?.data?.message || 'Failed to update goal.');
          }
        }
      );
    } else {
      createGoal.mutate(
        payload,
        {
          onSuccess: () => {
            setIsAddingGoal(false);
            resetGoalForm();
          },
          onError: (err: any) => {
            setGoalError(err.response?.data?.message || 'Failed to create savings goal.');
          }
        }
      );
    }
  };

  const handleIncrementGoalSavings = (goal: any) => {
    const incrementVal = parseFloat(contribAmount);
    if (isNaN(incrementVal) || incrementVal <= 0) {
      alert('Please enter a positive contribution amount.');
      return;
    }

    updateGoal.mutate(
      {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount + incrementVal,
        targetDate: goal.targetDate
      },
      {
        onSuccess: () => {
          setContribGoalId(null);
          setContribAmount('');
        }
      }
    );
  };

  const resetGoalForm = () => {
    setGoalName('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    setGoalTargetDate('');
  };

  const startEditBudget = (b: any) => {
    setEditingBudgetId(b.id);
    setBudgetCategory(b.category);
    setBudgetLimit(b.amountLimit.toString());
    setBudgetMonth(b.month);
    setIsAddingBudget(true);
  };

  const startEditGoal = (g: any) => {
    setEditingGoalId(g.id);
    setGoalName(g.name);
    setGoalTargetAmount(g.targetAmount.toString());
    setGoalCurrentAmount(g.currentAmount.toString());
    setGoalTargetDate(g.targetDate);
    setIsAddingGoal(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Budgets & Savings Goals</h1>
          <p className="text-slate-400 text-xs mt-1">
            {activeTab === 'BUDGETS' 
              ? 'Configure maximum spending ceilings to align with financial plans.' 
              : 'Establish milestone saving objectives with target calculators.'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/5">
          <button
            onClick={() => setActiveTab('BUDGETS')}
            className={`p-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'BUDGETS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Budgets
          </button>
          <button
            onClick={() => setActiveTab('GOALS')}
            className={`p-1.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'GOALS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Savings Goals
          </button>
        </div>
      </div>

      {activeTab === 'BUDGETS' ? (
        /* ================= BUDGETS TAB ================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            {!isAddingBudget && (
              <button
                onClick={() => {
                  setEditingBudgetId(null);
                  setBudgetLimit('');
                  setBudgetMonth(selectedMonth);
                  setIsAddingBudget(true);
                }}
                className="flex items-center gap-1.5 p-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs transition-all text-white cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Budget Limit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left/Middle Column: Budgets list */}
            <div className="lg:col-span-2 space-y-4">
              {budgetsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : budgets.length === 0 ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-500 flex items-center justify-center mb-4">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-sm">No Budget Limits Configured</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Keep your finances disciplined! Create custom monthly limits for specific spending categories.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgets.map((b) => {
                    const ratio = Math.min(1, b.spent / b.amountLimit);
                    const pct = (ratio * 100).toFixed(0);
                    const remaining = Math.max(0, b.amountLimit - b.spent);

                    let barColor = 'bg-indigo-500';
                    let bgAccent = 'border-white/5 hover:border-white/10';
                    if (ratio >= 1.0) {
                      barColor = 'bg-rose-500';
                      bgAccent = 'border-rose-500/20 bg-rose-500/5';
                    } else if (ratio >= 0.8) {
                      barColor = 'bg-amber-500';
                      bgAccent = 'border-amber-500/20 bg-amber-500/5';
                    }

                    return (
                      <motion.div
                        key={b.id}
                        layout
                        className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between h-40 ${bgAccent}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white text-xs capitalize">{b.category.toLowerCase()}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">Limit: ${b.amountLimit.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditBudget(b)}
                              className="p-1 text-slate-500 hover:text-indigo-400 rounded transition-colors cursor-pointer"
                              title="Edit Limit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this category budget?')) {
                                  deleteBudget.mutate({ id: b.id, month: b.month });
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Delete Budget"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress visual */}
                        <div className="my-2 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Spent: ${b.spent.toFixed(2)}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`} 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-bold border-t border-white/5 pt-2">
                          <span className="text-slate-500">Remaining</span>
                          <span className={ratio >= 1.0 ? 'text-rose-400' : 'text-emerald-400'}>
                            ${remaining.toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {isAddingBudget && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                      <h3 className="font-bold text-white text-xs">
                        {editingBudgetId ? 'Modify Budget Limit' : 'Link New Category Limit'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsAddingBudget(false);
                          setEditingBudgetId(null);
                        }}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleBudgetSubmit} className="space-y-3.5">
                      {budgetError && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{budgetError}</span>
                        </div>
                      )}

                      {/* Category Selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
                        <select
                          value={budgetCategory}
                          onChange={(e) => setBudgetCategory(e.target.value)}
                          disabled={!!editingBudgetId}
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Limit Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Limit Amount ($)</label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            placeholder="0.00"
                            value={budgetLimit}
                            onChange={(e) => setBudgetLimit(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>

                      {/* Month Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Month</label>
                        <input
                          type="month"
                          value={budgetMonth}
                          onChange={(e) => setBudgetMonth(e.target.value)}
                          disabled={!!editingBudgetId}
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={createBudget.isPending || updateBudget.isPending}
                        className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {createBudget.isPending || updateBudget.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : editingBudgetId ? (
                          'Update Limit'
                        ) : (
                          'Save Budget Limit'
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      ) : (
        /* ================= SAVINGS GOALS TAB ================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Financial Goals</span>
            {!isAddingGoal && (
              <button
                onClick={() => {
                  setEditingGoalId(null);
                  resetGoalForm();
                  setIsAddingGoal(true);
                }}
                className="flex items-center gap-1.5 p-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs transition-all text-white cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Create Goal
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left/Middle Column: Goals List */}
            <div className="lg:col-span-2 space-y-4">
              {goalsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : goals.length === 0 ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-500 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-sm">No Savings Goals Set</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Planning for a car, vacation, or emergency fund? Set targeted savings metrics and track completion paths.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map((g) => {
                    const progress = g.percentageProgress || 0;
                    return (
                      <motion.div
                        key={g.id}
                        layout
                        className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl hover:border-white/10 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{g.name}</h4>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                                g.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              }`}>
                                {g.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Target Date: {g.targetDate}</p>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              onClick={() => startEditGoal(g)}
                              className="p-1.5 text-slate-500 hover:text-indigo-400 rounded hover:bg-white/5 transition-all cursor-pointer"
                              title="Edit Goal"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this savings goal?')) {
                                  deleteGoal.mutate(g.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-white/5 transition-all cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Info */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-300">
                            <span>Saved: ${g.currentAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 mt-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2 px-3.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{g.estimatedCompletionText}</span>
                          </div>
                        </div>

                        {/* Increment Savings Contributions inline */}
                        {contribGoalId === g.id ? (
                          <div className="flex items-center gap-2 mt-4 border-t border-white/5 pt-4">
                            <input
                              type="number"
                              placeholder="Contribution Amount ($)"
                              value={contribAmount}
                              onChange={(e) => setContribAmount(e.target.value)}
                              className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleIncrementGoalSavings(g)}
                              className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-lg text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              onClick={() => setContribGoalId(null)}
                              className="p-1.5 text-slate-500 hover:text-white rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          g.status !== 'COMPLETED' && (
                            <button
                              onClick={() => setContribGoalId(g.id)}
                              className="mt-4 p-1.5 px-3.5 bg-slate-950 border border-white/5 hover:border-white/10 hover:bg-slate-900 rounded-lg text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <PlusCircle className="w-3 h-3" /> Add Contribution Savings
                            </button>
                          )
                        )}

                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Goal Form Column */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {isAddingGoal && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                      <h3 className="font-bold text-white text-xs">
                        {editingGoalId ? 'Modify Savings Goal' : 'Create Savings Goal'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsAddingGoal(false);
                          setEditingGoalId(null);
                          resetGoalForm();
                        }}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleGoalSubmit} className="space-y-3.5">
                      {goalError && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{goalError}</span>
                        </div>
                      )}

                      {/* Goal Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Goal Name</label>
                        <input
                          type="text"
                          placeholder="e.g. New Macbook Pro"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      {/* Target Amount */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target savings ($)</label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            placeholder="0.00"
                            value={goalTargetAmount}
                            onChange={(e) => setGoalTargetAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Current Amount */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current savings ($)</label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            placeholder="0.00"
                            value={goalCurrentAmount}
                            onChange={(e) => setGoalCurrentAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Target Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Date</label>
                        <input
                          type="date"
                          value={goalTargetDate}
                          onChange={(e) => setGoalTargetDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={createGoal.isPending || updateGoal.isPending}
                        className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {createGoal.isPending || updateGoal.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : editingGoalId ? (
                          'Update Goal details'
                        ) : (
                          'Save Financial Goal'
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
