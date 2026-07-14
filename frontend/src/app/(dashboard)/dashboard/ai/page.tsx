'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  TrendingUp,
  Brain,
  Sliders,
  Send,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { aiService, ChatMessage, FinancialInsight, BudgetRecommendation, FinancialHealthScore, FinancialSummary } from '@/services/aiService';

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#6366f1',         // Indigo
  SHOPPING: '#ec4899',     // Pink
  TRAVEL: '#3b82f6',       // Blue
  RECHARGE: '#10b981',     // Emerald
  UTILITIES: '#f59e0b',    // Amber
  BILLS: '#8b5cf6',        // Violet
  MEDICAL: '#ef4444',      // Red
  EDUCATION: '#06b6d4',    // Cyan
  INVESTMENT: '#14b8a6',   // Teal
  ENTERTAINMENT: '#a855f7',// Purple
  SALARY: '#22c55e',       // Green
  TRANSFER: '#64748b',     // Slate
  OTHER: '#94a3b8'         // Cool Slate
};

export default function AiHubPage() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'insights' | 'budgets' | 'health'>('assistant');
  const [chatList, setChatList] = useState<ChatMessage[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [insightsList, setInsightsList] = useState<FinancialInsight[]>([]);
  const [budgetRecs, setBudgetRecs] = useState<BudgetRecommendation[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [applyingRecId, setApplyingRecId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAllData = async () => {
    try {
      setPageLoading(true);
      const [chats, insights, recs, score, summary] = await Promise.all([
        aiService.getChatHistory(),
        aiService.getInsights(),
        aiService.getBudgetRecommendations(),
        aiService.getHealthScore(),
        aiService.getSummary()
      ]);
      setChatList(chats);
      setInsightsList(insights);
      setBudgetRecs(recs);
      setHealthScore(score);
      setSummaryData(summary);
    } catch (err) {
      console.error('Failed to load AI Assistant data', err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatList]);

  const handleSendPrompt = async (messageText: string) => {
    if (!messageText.trim()) return;
    try {
      setChatLoading(true);
      setPromptInput('');
      
      // Optimistic user insert
      const userMsg: ChatMessage = {
        role: 'USER',
        message: messageText,
        createdAt: new Date().toISOString()
      };
      setChatList((prev) => [...prev, userMsg]);

      // Call backend
      const res = await aiService.chat(messageText);

      // Assistant insert
      const assistantMsg: ChatMessage = {
        role: 'ASSISTANT',
        message: res.response,
        createdAt: res.timestamp
      };
      setChatList((prev) => [...prev, assistantMsg]);

      // Refresh health score & insights concurrently since chat changes them
      const [freshScore, freshInsights, freshSummary, freshRecs] = await Promise.all([
        aiService.getHealthScore(),
        aiService.getInsights(),
        aiService.getSummary(),
        aiService.getBudgetRecommendations()
      ]);
      setHealthScore(freshScore);
      setInsightsList(freshInsights);
      setSummaryData(freshSummary);
      setBudgetRecs(freshRecs);

    } catch (err) {
      console.error('Failed to communicate with AI Chat', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApplyBudget = async (id: string) => {
    try {
      setApplyingRecId(id);
      await aiService.applyBudgetRecommendation(id);
      // Refresh recs
      const freshRecs = await aiService.getBudgetRecommendations();
      setBudgetRecs(freshRecs);
    } catch (err) {
      console.error('Failed to apply budget recommendation', err);
      alert('Failed to apply recommended budget. Please try again.');
    } finally {
      setApplyingRecId(null);
    }
  };

  const quickPrompts = [
    "How much did I spend this month?",
    "Show my food expenses.",
    "What is my biggest expense?",
    "Who received the most money?",
    "Suggest a monthly budget.",
    "Show transactions above ₹5000.",
    "How much did I save?",
    "Show last month's UPI payments"
  ];

  if (pageLoading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-slate-100">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-slate-400 text-xs font-semibold tracking-wider">Syncing intelligence ledger...</p>
      </div>
    );
  }

  const categoryChartData = summaryData?.categoryBreakdown
    ? Object.entries(summaryData.categoryBreakdown).map(([name, value]) => ({
        name,
        value: Number(value)
      })).filter(item => item.value > 0)
    : [];

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-50 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Brain className="h-6 w-6" />
            </div>
            <span>AI Assistant & Smart Insights</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Get custom budget suggestions, conversational metrics, and financial advice</p>
        </div>
        <button
          onClick={fetchAllData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-white/5 text-slate-300 hover:bg-slate-850 hover:text-white transition-all shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Primary Tab Selectors */}
      <div className="flex border-b border-white/5 gap-1.5 p-1 bg-slate-900/40 rounded-xl max-w-md">
        {[
          { id: 'assistant', label: 'AI Chat', icon: MessageSquare },
          { id: 'insights', label: 'Insights', icon: TrendingUp },
          { id: 'budgets', label: 'Budgets', icon: Sliders },
          { id: 'health', label: 'Health Score', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Screen Area */}
      <div className="min-h-[60vh]">
        <AnimatePresence mode="wait">
          {/* TAB 1: CONVERSATIONAL ASSISTANT */}
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start"
            >
              {/* Suggestions Panel */}
              <div className="lg:col-span-1 space-y-4 bg-slate-900/35 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 pb-3 border-b border-white/5">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Suggested Questions</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendPrompt(prompt)}
                      className="text-left text-slate-400 hover:text-indigo-300 bg-slate-950/40 hover:bg-indigo-500/5 hover:border-indigo-500/20 border border-white/5 rounded-xl p-2.5 text-[11px] font-semibold transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Central Chat Interface */}
              <div className="lg:col-span-3 flex flex-col bg-slate-900/20 border border-white/5 rounded-2xl h-[65vh] overflow-hidden shadow-2xl relative">
                {/* Chat Log Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {chatList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                      <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Sparkles className="h-8 w-8 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">Meet your AI Financial Assistant</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Ask questions about your transactions, categories, savings, budgets, and get suggestions</p>
                      </div>
                    </div>
                  ) : (
                    chatList.map((chat, idx) => {
                      const isUser = chat.role === 'USER';
                      return (
                        <div
                          key={idx}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
                        >
                          <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-md ${
                              isUser ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {isUser ? 'U' : 'AI'}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border shadow-sm ${
                              isUser
                                ? 'bg-indigo-650/90 border-indigo-500 text-white rounded-tr-none'
                                : 'bg-slate-900 border-white/5 text-slate-200 rounded-tl-none whitespace-pre-line'
                            }`}>
                              {chat.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {chatLoading && (
                    <div className="flex justify-start w-full">
                      <div className="flex gap-3 items-center max-w-[80%]">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                          AI
                        </div>
                        <div className="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-white/5 text-slate-400 text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Prompt Query Input */}
                <div className="p-3 bg-slate-950/60 border-t border-white/5 flex items-center gap-2">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(promptInput)}
                    placeholder="Ask about spending, budgets, goals..."
                    className="flex-1 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                  <button
                    onClick={() => handleSendPrompt(promptInput)}
                    disabled={!promptInput.trim() || chatLoading}
                    className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs disabled:opacity-40 disabled:hover:bg-indigo-500 shadow-lg shadow-indigo-500/10 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SMART INSIGHTS */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Income</span>
                    <h3 className="text-base font-black text-slate-100">₹{summaryData?.totalIncome.toLocaleString()}</h3>
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Expenses</span>
                    <h3 className="text-base font-black text-slate-100">₹{summaryData?.totalExpenses.toLocaleString()}</h3>
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Savings</span>
                    <h3 className="text-base font-black text-slate-100">₹{summaryData?.netSavings.toLocaleString()}</h3>
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Savings Rate</span>
                    <h3 className="text-base font-black text-slate-100">{summaryData?.savingsRate}%</h3>
                  </div>
                </div>
              </div>

              {/* Insights List & Recharts Visualizer */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Insights Listing */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Smart Insights Queue</h3>
                  <div className="space-y-3">
                    {insightsList.length === 0 ? (
                      <p className="text-slate-500 text-xs py-8 text-center bg-slate-900/10 border border-white/5 rounded-xl">No insights generated yet. Spend or inquire to populate data.</p>
                    ) : (
                      insightsList.map((insight) => (
                        <div
                          key={insight.id}
                          className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex items-start gap-3.5 hover:border-indigo-500/20 transition-colors"
                        >
                          <div className={`p-2 rounded-lg mt-0.5 border ${
                            insight.type === 'SPENDING' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            insight.type === 'MONTHLY' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-200">{insight.title}</h4>
                            <p className="text-[11px] leading-relaxed text-slate-400 font-semibold">{insight.description}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Visualizer Chart */}
                <div className="lg:col-span-2 bg-slate-900/20 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Categorical Expense Distribution</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Proportionate view of SUCCESS wallet expenditures</p>
                  </div>
                  {categoryChartData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-600 text-xs">No chart records this cycle</div>
                  ) : (
                    <div className="h-48 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '10px' }}
                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Interactive Legend overlay */}
                      <div className="absolute flex flex-col gap-1 text-[9px] font-bold text-slate-400 left-0 bottom-0 bg-slate-950/60 p-2 rounded-lg border border-white/5">
                        {categoryChartData.slice(0, 3).map((item) => (
                          <div key={item.name} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name] }} />
                            <span>{item.name}: ₹{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: BUDGET RECOMMENDATIONS */}
          {activeTab === 'budgets' && (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Budget suggestions</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Heuristic limits computed based on your category velocity</p>
                </div>
              </div>

              {budgetRecs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-white/5 bg-slate-900/10 rounded-2xl text-xs">
                  No budget recommendations generated yet. Log some transactions in shopping, travel, food, etc.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgetRecs.map((rec) => {
                    const pctSpent = rec.recommendedAmount > 0 ? (rec.currentSpending / rec.recommendedAmount) * 100 : 0;
                    return (
                      <div
                        key={rec.id}
                        className="bg-slate-900/35 border border-white/5 rounded-2xl p-5 space-y-4 hover:border-indigo-500/20 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold`} style={{ backgroundColor: (CATEGORY_COLORS[rec.category] || '#94a3b8') + '22', color: CATEGORY_COLORS[rec.category] }}>
                                {rec.category}
                              </span>
                              <h4 className="text-sm font-black text-slate-200 mt-1.5">Limit suggestion: ₹{rec.recommendedAmount.toLocaleString()}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 font-semibold block">Spent Current Month</span>
                              <span className="text-xs font-bold text-slate-300">₹{rec.currentSpending.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400">Budget Progress</span>
                              <span className={pctSpent > 90 ? 'text-red-400' : 'text-slate-300'}>{pctSpent.toFixed(0)}% used</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pctSpent > 90 ? 'bg-red-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${Math.min(pctSpent, 100)}%` }}
                              />
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">{rec.reasoning}</p>
                        </div>

                        <div className="pt-2">
                          {rec.isApplied ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 justify-center">
                              <CheckCircle className="h-4 w-4" />
                              <span>Applied as Active Limit</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApplyBudget(rec.id)}
                              disabled={applyingRecId === rec.id}
                              className="w-full flex items-center gap-1.5 px-3 py-2.5 justify-center rounded-xl bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-white font-bold text-xs shadow-md transition-all"
                            >
                              {applyingRecId === rec.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sliders className="h-3.5 w-3.5" />
                              )}
                              <span>Apply Recommendation</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: FINANCIAL HEALTH */}
          {activeTab === 'health' && (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
              {/* Radial Score Gauge */}
              <div className="lg:col-span-2 bg-slate-900/35 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Score Card</h3>
                
                {/* Score visualization circular gauge */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Outer circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#1e293b"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="url(#indigoGrad)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (healthScore?.score || 0) / 100)}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Centered text */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-50">{healthScore?.score}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">FICO Rating</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-350">
                    {healthScore && healthScore.score >= 80 ? 'Excellent Standing' :
                     healthScore && healthScore.score >= 60 ? 'Good Standing' :
                     healthScore && healthScore.score >= 40 ? 'Fair Standing' : 'Needs Focus'}
                  </h4>
                  <p className="text-[10px] text-slate-500">Recalculated instantly on recent cashflow velocities</p>
                </div>
              </div>

              {/* Factors Breakdown */}
              <div className="lg:col-span-3 bg-slate-900/20 border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation breakdown</h3>
                
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[10px] text-slate-500 font-bold block">SAVINGS RATIO</span>
                    <span className="text-sm font-black text-slate-100">{healthScore?.savingsRate}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[10px] text-slate-500 font-bold block">BUDGET DISCIPLINE</span>
                    <span className="text-sm font-black text-slate-100">{healthScore?.budgetAdherence}%</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs font-semibold leading-relaxed">
                  {healthScore?.factorBreakdown.split('\n').map((factor, idx) => {
                    const isPositive = factor.includes('+10 pts') || factor.includes('+20 pts') || factor.includes('+30 pts') || factor.includes('+40 pts') || factor.includes('+25 pts');
                    return (
                      <div key={idx} className="flex gap-2.5 items-start">
                        {isPositive ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-555 text-yellow-450 shrink-0 mt-0.5" />
                        )}
                        <span className={isPositive ? 'text-slate-350' : 'text-slate-450'}>{factor}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
