"use client";

import React, { useState } from "react";
import { Incident, updateIncidentStatus } from "../lib/api";
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, ArrowRight, ShieldCheck } from "lucide-react";

interface IncidentViewerProps {
  incidents: Incident[];
  onRefresh: () => void;
}

export const IncidentViewer: React.FC<IncidentViewerProps> = ({ incidents, onRefresh }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateIncidentStatus(id, newStatus, `Updated via SOC interface to ${newStatus}`);
      onRefresh();
    } catch (err) {
      alert("Failed to update incident status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-slate-100">Temporal Risk Correlation & Incident Chains</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-stage attack pattern detection correlating prompt injection, unauthorized probing, and exfiltration attempts.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          Refresh Incidents
        </button>
      </div>

      <div className="space-y-4 mt-6">
        {incidents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
            No active incidents detected. All multi-agent workflows are operating within normal parameters.
          </div>
        ) : (
          incidents.map((inc) => {
            const isCritical = inc.severity === "CRITICAL";
            const isOpen = inc.status === "OPEN";
            return (
              <div
                key={inc.incident_id}
                className={`p-5 rounded-xl border transition ${
                  isCritical
                    ? "bg-rose-950/20 border-rose-500/30"
                    : "bg-purple-950/20 border-purple-500/30"
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isCritical
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                            : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        }`}
                      >
                        {inc.severity} SEVERITY
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-100">
                        {inc.rule_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-medium">{inc.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                        isOpen
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : inc.status === "CONTAINED"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {inc.status}
                    </span>

                    {isOpen && (
                      <button
                        onClick={() => handleUpdateStatus(inc.incident_id, "CONTAINED")}
                        disabled={updatingId === inc.incident_id}
                        className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition"
                      >
                        Contain
                      </button>
                    )}
                    {inc.status === "CONTAINED" && (
                      <button
                        onClick={() => handleUpdateStatus(inc.incident_id, "RESOLVED")}
                        disabled={updatingId === inc.incident_id}
                        className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Correlated Event Chain */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px] font-semibold">
                    Correlated Attack Step Sequence ({inc.correlated_event_ids.length} Events):
                  </span>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {inc.correlated_event_ids.map((evId, idx) => (
                      <React.Fragment key={evId}>
                        <span className="font-mono text-[10px] px-2 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                          {evId}
                        </span>
                        {idx < inc.correlated_event_ids.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
                    <span>Workflow: {inc.workflow_id}</span>
                    <span>•</span>
                    <span>Affected: {inc.affected_agents.join(", ")}</span>
                    <span>•</span>
                    <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
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
