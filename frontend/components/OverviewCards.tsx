"use client";

import React from "react";
import { SystemMetrics } from "../lib/api";
import { Shield, ShieldAlert, Radio, CheckCircle2, Ban } from "lucide-react";

interface OverviewCardsProps {
  metrics: SystemMetrics | null;
  onNavigateTab: (tab: string) => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ metrics, onNavigateTab }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="clay-cushion-cream h-32 animate-pulse rounded-[38px]"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      cushionClass: "clay-cushion-mint",
      num: "01",
      title: "OPERATIONS GATED",
      value: metrics.total_events,
      icon: Shield,
      dotColor: "recessed-dot-active",
      tab: "timeline",
      sublabel: "Total PEP Gated Calls",
    },
    {
      cushionClass: "clay-cushion-cool",
      num: "02",
      title: "AUTHORIZED [ALLOW]",
      value: metrics.allowed_count,
      icon: CheckCircle2,
      dotColor: "recessed-dot-green",
      tab: "timeline",
      sublabel: "Policy Matched",
    },
    {
      cushionClass: "clay-cushion-pink",
      num: "03",
      title: "INTERCEPTED [DENY]",
      value: metrics.denied_count,
      icon: Ban,
      dotColor: metrics.denied_count > 0 ? "recessed-dot-orange" : "recessed-dot-inactive",
      tab: "timeline",
      sublabel: "Zero-Bypass Intercept",
    },
    {
      cushionClass: "clay-cushion-warm",
      num: "04",
      title: "ADVISORY AI SIGNALS",
      value: metrics.flagged_signals_count,
      icon: Radio,
      dotColor: metrics.flagged_signals_count > 0 ? "recessed-dot-orange" : "recessed-dot-inactive",
      tab: "timeline",
      sublabel: "Heuristic & Gemma Flags",
    },
    {
      cushionClass: "clay-cushion-lavender",
      num: "05",
      title: "CORRELATED INCIDENTS",
      value: metrics.open_incidents_count,
      icon: ShieldAlert,
      dotColor: metrics.open_incidents_count > 0 ? "recessed-dot-orange" : "recessed-dot-green",
      tab: "incidents",
      sublabel: "Active Attack Chains",
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <span className="recessed-dot recessed-dot-active"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#383139]">
            System Telemetry Deck // Real-Time State
          </span>
        </div>
        <span className="text-[12px] font-medium text-[#48404b]">
          Real-time Refresh: Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className={`${card.cushionClass} p-5 text-left transition-transform duration-interaction hover:-translate-y-1.5 focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#383139] focus-visible:outline-offset-2 group relative`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#48404b]">
                  [{card.num}]
                </span>
                <span className={`recessed-dot ${card.dotColor}`} aria-hidden="true"></span>
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-bold tracking-tight text-[#48404b] uppercase">
                  {card.title}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-[#383139] font-mono">
                    {card.value.toString().padStart(3, "0")}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(56,49,57,0.1)] group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-[#383139]" />
                  </div>
                </div>
                <div className="text-[12px] font-medium text-[#48404b]/90 mt-1 truncate">
                  {card.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
