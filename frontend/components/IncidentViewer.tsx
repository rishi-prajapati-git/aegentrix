"use client";

import React, { useState } from "react";
import { Incident, updateIncidentStatus } from "../lib/api";
import { ShieldAlert, ArrowRight, ShieldCheck, Shield } from "lucide-react";

interface IncidentViewerProps {
  incidents: Incident[];
  onRefresh: () => void;
}

export const IncidentViewer: React.FC<IncidentViewerProps> = ({ incidents, onRefresh }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setErrorMsg(null);
    try {
      await updateIncidentStatus(id, newStatus, `Updated via Claymorphism SOC interface to ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update incident status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#48404b]">
              Bay 04 // Incident Chains
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f6a3ca] text-[#383139]">
              TEMPORAL
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#383139] mt-0.5">
            Correlated Incident Chains
          </h2>
          <p className="text-xs sm:text-sm text-[#48404b] mt-0.5">
            Multi-step attack correlation across distributed agent requests and exfiltration routes.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            onRefresh();
          }}
          className="clay-btn clay-btn-cream px-4 py-2 text-xs font-bold text-[#383139] self-start sm:self-center"
        >
          Poll Incidents
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-[22px] bg-[#f6a3ca]/30 border border-[#f6a3ca] text-[#78234e] text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[#78234e] font-extrabold hover:opacity-80 px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="clay-cushion-mint p-8 text-center text-[#245842] rounded-[38px]">
            <ShieldCheck className="w-10 h-10 mx-auto text-[#245842] mb-2" />
            <div className="font-bold text-base">Zero Active Incidents Detected</div>
            <div className="text-xs mt-1 text-[#245842]/80">
              All multi-agent workflow boundaries and privilege levels remain strictly compliant.
            </div>
          </div>
        ) : (
          incidents.map((inc) => {
            const isCritical = inc.severity === "CRITICAL";
            const isOpen = inc.status === "OPEN";
            return (
              <div
                key={inc.incident_id}
                className={`p-4 sm:p-5 rounded-[30px] transition-all overflow-hidden shadow-[0_12px_24px_-6px_rgba(56,49,57,0.08),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(56,49,57,0.08)] ${
                  isCritical
                    ? "bg-[#fffdf7] border-2 border-[#f6a3ca]"
                    : "bg-[#fffdf7]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#383139]/10">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="recessed-dot recessed-dot-orange shrink-0"></span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          isCritical
                            ? "bg-[#f6a3ca] text-[#78234e]"
                            : "bg-[#f9e7a8] text-[#6b5816]"
                        }`}
                      >
                        {inc.severity} RISK
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#383139] break-words break-all font-mono leading-tight">
                        {inc.rule_name}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#48404b] mt-2 font-medium leading-relaxed break-words">
                      {inc.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                        isOpen
                          ? "bg-[#f6a3ca] text-[#78234e]"
                          : inc.status === "CONTAINED"
                          ? "bg-[#f9e7a8] text-[#6b5816]"
                          : "bg-[#c0efdc] text-[#245842]"
                      }`}
                    >
                      {inc.status}
                    </span>

                    {isOpen && (
                      <button
                        onClick={() => handleUpdateStatus(inc.incident_id, "CONTAINED")}
                        disabled={updatingId === inc.incident_id}
                        className="clay-btn clay-btn-warm px-3 py-1 text-xs font-bold text-[#383139]"
                      >
                        Contain
                      </button>
                    )}
                    {inc.status === "CONTAINED" && (
                      <button
                        onClick={() => handleUpdateStatus(inc.incident_id, "RESOLVED")}
                        disabled={updatingId === inc.incident_id}
                        className="clay-btn clay-btn-mint px-3 py-1 text-xs font-bold text-[#383139]"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Correlated Event Sequence Flow */}
                <div className="mt-3 pt-1 space-y-2.5">
                  <span className="text-[#48404b] text-xs font-bold uppercase block">
                    Correlated Event Sequence ({inc.correlated_event_ids.length} Steps):
                  </span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    {inc.correlated_event_ids.map((evId, idx) => (
                      <React.Fragment key={evId}>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#f1f2fa] text-[#383139] shadow-[inset_1px_1px_2px_rgba(56,49,57,0.1),0_1px_0_rgba(255,255,255,0.9)] break-all">
                          {evId}
                        </span>
                        {idx < inc.correlated_event_ids.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-[#383139] shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Clean, responsive metadata card grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#383139]/10 text-xs">
                    <div className="min-w-0 bg-white/70 p-2 rounded-[14px] shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-[#48404b]/80 block">Workflow</span>
                      <span className="font-mono font-bold text-[#383139] text-xs truncate block" title={inc.workflow_id}>
                        {inc.workflow_id}
                      </span>
                    </div>
                    <div className="min-w-0 bg-white/70 p-2 rounded-[14px] shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-[#48404b]/80 block">Targets</span>
                      <span className="font-mono font-bold text-[#383139] text-xs truncate block" title={inc.affected_agents.join(", ")}>
                        {inc.affected_agents.join(", ") || "None"}
                      </span>
                    </div>
                    <div className="min-w-0 bg-white/70 p-2 rounded-[14px] shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-[#48404b]/80 block">Logged</span>
                      <span className="font-bold text-[#383139] text-xs block">
                        {new Date(inc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
