"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Shield, 
  Zap, 
  Smartphone, 
  Send, 
  QrCode, 
  UserCheck, 
  ArrowRight, 
  Lock, 
  Sparkles,
  Users,
  Activity
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Apex<span className="text-indigo-400">Pay</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#developers" className="hover:text-white transition-colors">Developers</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/login" className="relative group overflow-hidden rounded-xl bg-white text-slate-950 font-semibold text-sm px-5 py-2.5 transition-all active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                Launch App <ArrowRight className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Digital Payments
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6"
          >
            Fast. Secure.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Borderless Payments.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed"
          >
            Send money instantly to anyone, pay bills with one-tap, and link multiple bank accounts securely. Built on high-performance Java and Next.js.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/register" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-xl font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0">
              View Developer Docs
            </Link>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 sm:gap-12 border-t border-white/5 pt-8 w-full max-w-lg"
          >
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">99.99%</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Uptime SLA</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">&lt; 200ms</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Latency</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">256-bit</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Encryption</div>
            </div>
          </motion.div>
        </div>

        {/* Hero Dashboard/Mobile Screen Mockup */}
        <div className="lg:col-span-5 relative flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-80 h-[560px] rounded-[40px] border-[8px] border-slate-800 bg-slate-900 shadow-2xl p-4 overflow-hidden flex flex-col justify-between"
          >
            {/* Mobile Header Bar */}
            <div className="flex justify-between items-center text-xs text-slate-400 px-3 pt-1">
              <span>9:41</span>
              <div className="w-18 h-4 rounded-full bg-slate-850 absolute left-1/2 -translate-x-1/2 top-2 border border-slate-800" />
              <div className="flex gap-1.5 items-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span>Secure</span>
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="flex-1 mt-6 flex flex-col gap-5">
              {/* Profile Card */}
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/20">
                    JD
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400">Welcome back</h4>
                    <h3 className="text-sm font-bold text-white">John Doe</h3>
                  </div>
                </div>
                <QrCode className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
              </div>

              {/* Balance Widget */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                <span className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">Total Balance</span>
                <h2 className="text-2xl font-black mt-1">$4,850.25</h2>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <Send className="w-3 h-3" /> Send
                  </button>
                  <button className="flex-1 bg-slate-950/40 hover:bg-slate-950/60 text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors">
                    + Top Up
                  </button>
                </div>
              </div>

              {/* Fast Transfers List */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-1">Quick Send</h3>
                <div className="flex justify-between px-1">
                  {[
                    { name: "Alice", initial: "A", color: "bg-pink-500" },
                    { name: "Bob", initial: "B", color: "bg-blue-500" },
                    { name: "Charlie", initial: "C", color: "bg-amber-500" },
                    { name: "David", initial: "D", color: "bg-teal-500" },
                  ].map((p, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 cursor-pointer">
                      <div className={`w-11 h-11 rounded-full ${p.color} text-white flex items-center justify-center font-bold shadow-md shadow-black/30 text-sm`}>
                        {p.initial}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
                  <span className="text-[10px] text-indigo-400 cursor-pointer hover:underline font-semibold">See All</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { title: "Sent to Alice", time: "2 mins ago", amt: "-$45.00", status: "success" },
                    { title: "Refund from Amazon", time: "2 hours ago", amt: "+$12.50", status: "success" },
                    { title: "Gas Bill Payment", time: "Yesterday", amt: "-$60.00", status: "pending" },
                  ].map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                          {t.amt.startsWith("+") ? (
                            <span className="text-emerald-400 text-xs">↓</span>
                          ) : (
                            <span className="text-indigo-400 text-xs">↑</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-200">{t.title}</h4>
                          <span className="text-[9px] text-slate-500">{t.time}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-extrabold ${t.amt.startsWith("+") ? "text-emerald-400" : "text-slate-200"}`}>{t.amt}</span>
                        <div className="text-[8px] text-slate-500 capitalize">{t.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Pill */}
            <div className="bg-slate-950/80 rounded-full border border-white/10 p-1 flex justify-between items-center mt-4">
              <button className="flex-1 py-2 text-indigo-400 text-[10px] font-bold flex flex-col items-center gap-0.5">
                <CreditCard className="w-3.5 h-3.5" /> Dashboard
              </button>
              <button className="flex-1 py-2 text-slate-400 hover:text-white text-[10px] font-bold flex flex-col items-center gap-0.5">
                <Send className="w-3.5 h-3.5" /> Transfer
              </button>
              <button className="flex-1 py-2 text-slate-400 hover:text-white text-[10px] font-bold flex flex-col items-center gap-0.5">
                <QrCode className="w-3.5 h-3.5" /> Scanner
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-indigo-400 text-sm font-extrabold tracking-wider uppercase mb-3">Enterprise Capabilities</h2>
          <h3 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Engineered for Modern Commerce
          </h3>
          <p className="text-slate-400 text-lg leading-relaxed">
            From multi-device active sessions to military-grade audits, ApexPay powers your financial interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-6 h-6 text-indigo-400" />,
              title: "Instant Bank Transfers",
              desc: "Direct peer-to-peer and peer-to-merchant settlements under 200ms using integrated mock bank accounts.",
            },
            {
              icon: <QrCode className="w-6 h-6 text-purple-400" />,
              title: "Dynamic QR Scanner",
              desc: "Generate personalized and transaction-specific QR codes with custom expiration rules and values.",
            },
            {
              icon: <Smartphone className="w-6 h-6 text-cyan-400" />,
              title: "Multi-Device Sessions",
              desc: "Monitor active browser sessions, IP addresses, and device profiles to protect against session hijacking.",
            },
            {
              icon: <Shield className="w-6 h-6 text-emerald-400" />,
              title: "Full JPA Auditing",
              desc: "Automated entity listeners capture every state change, tracking performed-by details and exact timestamps.",
            },
            {
              icon: <Activity className="w-6 h-6 text-pink-400" />,
              title: "Real-time Notifications",
              desc: "Instantly trigger transaction, warning, and system alert updates directly to customer device dashboards.",
            },
            {
              icon: <Users className="w-6 h-6 text-indigo-400" />,
              title: "Beneficiary Management",
              desc: "Add frequent receivers, saving UPI IDs and account numbers securely with nickname assignments.",
            },
          ].map((feat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, borderColor: "rgba(99,102,241,0.3)" }}
              className="bg-slate-900/40 border border-white/5 rounded-2xl p-6.5 flex flex-col gap-4 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-inner border border-white/5">
                {feat.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">{feat.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Info Banner */}
      <section id="security" className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-3xl border border-white/10 p-8 sm:p-12 relative overflow-hidden flex flex-col lg:flex-row gap-12 items-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-6">
              <Lock className="w-3.5 h-3.5" /> High Assurance Security
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              State-of-the-Art Bank Connection & Integrity
            </h3>
            <p className="text-slate-400 leading-relaxed max-w-xl mb-6">
              Our backend matches relational constraints in Third Normal Form (3NF) to guarantee transaction integrity, enforce unique reference IDs, and handle concurrent settlements securely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-200">JWT Stateless Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-200">Role-Based Access Logic</span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-auto flex justify-center">
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 shadow-2xl w-full max-w-sm">
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500 animate-pulse" /> Health Engine Status
              </h4>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Database Connection</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (UP)</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Redis Cache Pool</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (UP)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">API Gateway Latency</span>
                  <span className="text-slate-200">12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-16 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ApexPay</span>
            </div>
            <p className="text-sm text-slate-400">
              An educational digital wallet and platform inspired by premium transaction flows.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer Portal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Tech Stack</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>Next.js 15 & React 19</li>
              <li>Spring Boot 3 & Java 21</li>
              <li>PostgreSQL & Redis</li>
              <li>Docker & Flyway</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Educational Disclaimer</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between text-xs">
          <span>&copy; 2026 ApexPay Platform. All rights reserved.</span>
          <span>Made for advanced education and demonstration.</span>
        </div>
      </footer>
    </div>
  );
}
