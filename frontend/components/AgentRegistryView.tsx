"use client";

import React, { useState } from "react";
import { AgentModel, updateAgentStatus } from "../lib/api";
import { Users, Shield, Check, X, Ban, RefreshCw, AlertTriangle } from "lucide-react";

interface AgentRegistryViewProps {
  agents: AgentModel[];
  onRefresh: () => void;
}

export const AgentRegistryView: React.FC<AgentRegistryViewProps> = ({ agents, onRefresh }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleStatus = async (agent: AgentModel) => {
    setUpdatingId(agent.agent_id);
    const newStatus = agent.status === "ACTIVE" ? "REVOKED" : "ACTIVE";
    try {
      await updateAgentStatus(agent.agent_id, newStatus, "Toggled from SOC dashboard");
      onRefresh();
    } catch (err) {
      alert("Failed to update agent status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Synthetic Agent Registry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative registry of agent identities, trust boundaries, and least-privilege capability profiles.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {agents.map((ag) => {
          const isRevoked = ag.status === "REVOKED";
          const isSuspended = ag.status === "SUSPENDED";
          return (
            <div
              key={ag.agent_id}
              className={`p-5 rounded-xl border transition-all ${
                isRevoked
                  ? "bg-rose-950/20 border-rose-500/40"
                  : isSuspended
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-100">{ag.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        ag.trust_tier === "PRIVILEGED"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {ag.trust_tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ag.role}</p>
                  <span className="text-[11px] font-mono text-cyan-400 mt-1 block">
                    {ag.agent_id}
                  </span>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${
                      isRevoked
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : isSuspended
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {ag.status}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(ag)}
                    disabled={updatingId === ag.agent_id}
                    className={`text-[11px] px-2.5 py-1 rounded border transition ${
                      isRevoked
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
                    }`}
                  >
                    {isRevoked ? "Restore Access" : "Revoke Privileges"}
                  </button>
                </div>
              </div>

              {/* Capability Matrix */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Allowed Resources:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ag.capabilities.allowed_resources.map((res, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold">Explicitly Prohibited:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ag.explicitly_denied_resources.map((res, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                {ag.capabilities.allowed_tools && ag.capabilities.allowed_tools.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold">Allowlisted Tools:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ag.capabilities.allowed_tools.map((tool, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
