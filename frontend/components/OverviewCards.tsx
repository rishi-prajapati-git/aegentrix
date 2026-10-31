"use client";

import React from "react";
import { SystemMetrics } from "../lib/api";
import { Shield, ShieldAlert, AlertTriangle, Radio, CheckCircle, Ban } from "lucide-react";

interface OverviewCardsProps {
  metrics: SystemMetrics | null;
  onNavigateTab: (tab: string) => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ metrics, onNavigateTab }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-cyber-card border border-cyber-border rounded-xl"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Protected Operations",
      value: metrics.total_events,
      icon: Shield,
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      tab: "timeline",
    },
    {
      title: "Authorized (Allowed)",
      value: metrics.allowed_count,
      icon: CheckCircle,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      tab: "timeline",
    },
    {
      title: "Blocked (Denied)",
      value: metrics.denied_count,
      icon: Ban,
      color: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      tab: "timeline",
    },
    {
      title: "Advisory AI Flags",
      value: metrics.flagged_signals_count,
      icon: Radio,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      tab: "timeline",
    },
    {
      title: "Open Security Incidents",
      value: metrics.open_incidents_count,
      icon: ShieldAlert,
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      tab: "incidents",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <button
            key={idx}
            onClick={() => onNavigateTab(card.tab)}
            className="text-left bg-cyber-card border border-cyber-border rounded-xl p-4 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bg} border ${card.border}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {card.value}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
