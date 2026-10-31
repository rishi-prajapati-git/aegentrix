"use client";

import React, { useState } from "react";
import { Incident, updateIncidentStatus } from "../lib/api";
import { ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

interface IncidentViewerProps {
  incidents: Incident[];
  onRefresh: () => void;
}

export const IncidentViewer: React.FC<IncidentViewerProps> = ({ incidents, onRefresh }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateIncidentStatus(id, newStatus, `Updated via Industrial SOC interface to ${newStatus}`);
      onRefresh();
    } catch (err) {
      alert("Failed to update incident status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-[#cbd0d2] border-2 border-[#b0b8bc] rounded-xl p-5 shadow-chassis relative">
      <span className="chassis-screw absolute top-3 left-3"></span>
      <span className="chassis-screw absolute top-3 right-3"></span>

      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#a4adb2] px-2 gap-3">
        <div className="flex items-center space-x-3">
          <div className="vent-assembly">
            <span className="vent-slot"></span>
            <span className="vent-slot"></span>
            <span className="vent-slot"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="engraved-label text-xs font-bold text-[#181e22]">BAY 04 // INCIDENT CHAINS</span>
              <span className="text-[10px] font-mono text-[#58656d]">TEMPORAL CORRELATION</span>
            </div>
            <p className="text-xs text-[#414b52] mt-0.5 font-sans">
              Autonomous multi-step attack correlation across distributed agent requests and exfiltration routes.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="chassis-key px-3 py-1.5 text-[11px] font-mono font-semibold text-[#181e22] self-start sm:self-center"
        >
          POLL INCIDENTS
        </button>
      </div>

      {/* Recessed Dark Incident Output Deck */}
      <div className="space-y-3 mt-4">
        {incidents.length === 0 ? (
          <div className="recessed-screen p-8 text-center text-[#7e8d96] text-xs font-mono">
            <ShieldCheck className="w-8 h-8 mx-auto text-[#4ade80] mb-2 opacity-80" />
            // ZERO ACTIVE INCIDENTS DETECTED // WORKFLOW BOUNDARIES COMPLIANT //
          </div>
        ) : (
          incidents.map((inc) => {
            const isCritical = inc.severity === "CRITICAL";
            const isOpen = inc.status === "OPEN";
            return (
              <div
                key={inc.incident_id}
                className={`recessed-screen p-4 border transition ${
                  isCritical ? "border-[#f15b22]/50 bg-[#241d20]" : "border-[#333d43] bg-[#1e2529]"
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-[#2e373d]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="lamp-orange"></span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#f15b22]/20 text-[#f15b22] border border-[#f15b22]/40 tracking-wider">
                        {inc.severity} RISK
                      </span>
                      <span className="text-xs font-mono font-bold text-[#f2f4f4]">{inc.rule_name}</span>
                    </div>
                    <p className="text-xs text-[#d8dee1] mt-2 font-mono">{inc.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isOpen
                          ? "bg-[#3d1a1e] text-[#f87171] border border-[#f87171]/40"
                          : inc.status === "CONTAINED"
                          ? "bg-[#362514] text-[#fbbf24] border border-[#fbbf24]/40"
                          : "bg-[#142c1f] text-[#4ade80] border border-[#4ade80]/40"
                      }`}
                    >
                      {inc.status}
                    </span>

                    {isOpen && (
                      <button
                        onClick={() => handleUpdateStatus(inc.incident_id, "CONTAINED")}
                        disabled={updatingId === inc.incident_id}
                        className="chassis-key px-2.5 py-1 text-[10px] font-mono font-bold text-[#181e22]"
                      >
                        CONTAIN
                      </button>
                    )}
                    {inc.status === "CONTAINED" && (
                      <button
                        onClick={() => handleUpdateStatus(inc.incident_id, "RESOLVED")}
                        disabled={updatingId === inc.incident_id}
                        className="chassis-key px-2.5 py-1 text-[10px] font-mono font-bold text-[#181e22]"
                      >
                        RESOLVE
                      </button>
                    )}
                  </div>
                </div>

                {/* Hardware Chain Sequence Flow */}
                <div className="mt-3 pt-1">
                  <span className="text-[#83939e] text-[10px] font-mono uppercase font-semibold block">
                    Correlated Event Sequence ({inc.correlated_event_ids.length} Steps):
                  </span>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {inc.correlated_event_ids.map((evId, idx) => (
                      <React.Fragment key={evId}>
                        <span className="font-mono text-[10px] px-2 py-1 rounded bg-[#13171a] text-[#f2f4f4] border border-[#2b353b]">
                          {evId}
                        </span>
                        {idx < inc.correlated_event_ids.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-[#f15b22]" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center space-x-3 text-[10px] text-[#7a8a94] font-mono">
                    <span>WF: {inc.workflow_id}</span>
                    <span>•</span>
                    <span>TARGETS: {inc.affected_agents.join(", ")}</span>
                    <span>•</span>
                    <span>LOGGED: {new Date(inc.timestamp).toLocaleTimeString()}</span>
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
