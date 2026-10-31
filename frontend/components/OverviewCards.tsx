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
      <div className="bg-[#b6bec2] p-2.5 rounded-xl shadow-well border border-[#a2abb0] border-b-white/80">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-[#20272b] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      bay: "TELEMETRY 01",
      title: "OPERATIONS GATED",
      value: metrics.total_events,
      icon: Shield,
      lamp: "lamp-green",
      valueColor: "text-[#f2f4f4]",
      tab: "timeline",
      sublabel: "Total PEP Gated Calls",
    },
    {
      bay: "TELEMETRY 02",
      title: "AUTHORIZED [ALLOW]",
      value: metrics.allowed_count,
      icon: CheckCircle2,
      lamp: "lamp-green",
      valueColor: "text-[#4ade80]",
      tab: "timeline",
      sublabel: "Policy Matched",
    },
    {
      bay: "TELEMETRY 03",
      title: "INTERCEPTED [DENY]",
      value: metrics.denied_count,
      icon: Ban,
      lamp: metrics.denied_count > 0 ? "lamp-orange" : "lamp-off",
      valueColor: "text-[#f87171]",
      tab: "timeline",
      sublabel: "Zero-Bypass Intercept",
    },
    {
      bay: "TELEMETRY 04",
      title: "ADVISORY AI SIGNALS",
      value: metrics.flagged_signals_count,
      icon: Radio,
      lamp: metrics.flagged_signals_count > 0 ? "lamp-orange" : "lamp-off",
      valueColor: "text-[#fbbf24]",
      tab: "timeline",
      sublabel: "Heuristic / Gemma Flag",
    },
    {
      bay: "TELEMETRY 05",
      title: "CORRELATED INCIDENTS",
      value: metrics.open_incidents_count,
      icon: ShieldAlert,
      lamp: metrics.open_incidents_count > 0 ? "lamp-orange" : "lamp-off",
      valueColor: metrics.open_incidents_count > 0 ? "text-[#f15b22]" : "text-[#d8dee1]",
      tab: "incidents",
      sublabel: "Active Attack Chains",
    },
  ];

  return (
    <div className="bg-[#b6bec2] p-2.5 rounded-xl shadow-well border border-[#a2abb0] border-b-white/80">
      <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-[#a4adb2]">
        <div className="flex items-center space-x-2">
          <span className="chassis-screw"></span>
          <span className="engraved-label text-[10px] text-[#2c353b]">
            SYSTEM TELEMETRY DECK // FACTUAL REGISTRY STATE
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="engraved-label text-[9px] text-[#414b52]">REAL-TIME REFRESH: ACTIVE</span>
          <span className="chassis-screw"></span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className="text-left recessed-screen p-3.5 hover:border-[#525f67] transition-all group relative focus:outline-none focus:ring-2 focus:ring-[#f15b22]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8b98a0] tracking-wider font-semibold">
                  {card.bay}
                </span>
                <span className={card.lamp} aria-hidden="true"></span>
              </div>

              <div className="mt-2">
                <div className="text-[11px] font-mono text-[#d8dee1] font-medium leading-tight">
                  {card.title}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className={`text-2xl font-bold font-mono tracking-tight ${card.valueColor}`}>
                    {card.value.toString().padStart(3, "0")}
                  </span>
                  <Icon className="w-4 h-4 text-[#5e6c75] group-hover:text-[#a0aeb7] transition-colors" />
                </div>
                <div className="text-[10px] font-mono text-[#828f96] mt-1 truncate">
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
