'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';

interface TimelineStep {
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
}

interface TransactionTimelineProps {
  steps: TimelineStep[];
}

export function TransactionTimeline({ steps }: TransactionTimelineProps) {
  return (
    <div className="space-y-6 bg-slate-950/40 border border-white/5 rounded-3xl p-6.5">
      <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold flex items-center gap-1.5 mb-4">
        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" /> Transaction Execution Flow
      </h4>

      <div className="relative pl-6 space-y-6">
        {/* Connector vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-900" />

        {steps.map((step, index) => {
          const isPending = step.status === 'pending';
          const isProcessing = step.status === 'processing';
          const isSuccess = step.status === 'success';
          const isFailed = step.status === 'failed';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative flex gap-4 items-start"
            >
              {/* Step indicator dot */}
              <div className="absolute -left-[23px] top-0.5 flex items-center justify-center bg-slate-950 rounded-full w-5 h-5 z-10">
                {isSuccess && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                )}
                {isProcessing && (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                )}
                {isPending && (
                  <Circle className="w-4 h-4 text-slate-700" />
                )}
                {isFailed && (
                  <CheckCircle2 className="w-5 h-5 text-rose-500 fill-rose-950" />
                )}
              </div>

              {/* Step text content */}
              <div className="space-y-0.5">
                <div className={`text-xs font-bold ${
                  isSuccess ? 'text-white' : 
                  isProcessing ? 'text-indigo-300' : 'text-slate-500'
                }`}>
                  {step.label}
                </div>
                <div className="text-[10px] text-slate-500 leading-normal">
                  {step.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
