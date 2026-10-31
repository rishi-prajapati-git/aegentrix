"use client";

import React, { useState } from "react";
import { AgentModel, updateAgentStatus } from "../lib/api";
import { Users, Shield, Check, X, Ban } from "lucide-react";

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
      await updateAgentStatus(agent.agent_id, newStatus, "Hardware switch toggled from SOC dashboard");
      onRefresh();
    } catch (err) {
      alert("Failed to update agent status");
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
              <span className="engraved-label text-xs font-bold text-[#181e22]">BAY 05 // AGENT REGISTRY MATRIX</span>
              <span className="text-[10px] font-mono text-[#58656d]">IDENTITY & CAPABILITY DECK</span>
            </div>
            <p className="text-xs text-[#414b52] mt-0.5 font-sans">
              Authoritative identity store, trust tier assignments, and least-privilege capability boundaries.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="chassis-key px-3 py-1.5 text-[11px] font-mono font-semibold text-[#181e22] self-start sm:self-center"
        >
          SYNC REGISTRY
        </button>
      </div>

      {/* Grid of Agent Module Plates */}
      <div className="bg-[#b6bec2] p-3 rounded-lg shadow-well border border-[#a2abb0] border-b-white mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {agents.map((ag) => {
          const isRevoked = ag.status === "REVOKED";
          return (
            <div
              key={ag.agent_id}
              className={`p-4 rounded border transition-all relative ${
                isRevoked
                  ? "bg-[#d4d9dc] border-[#f87171]/50 shadow-inner"
                  : "bg-[#e7eaeb] border-[#ffffff] border-b-[#9ca5aa] shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              }`}
            >
              <span className="chassis-screw absolute top-2 right-2"></span>

              <div className="flex items-start justify-between pr-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={isRevoked ? "lamp-orange" : "lamp-green"}></span>
                    <h3 className="text-sm font-bold text-[#181e22]">{ag.name}</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#cbd0d2] text-[#2c373d] border border-[#a5afb5] font-semibold uppercase">
                      {ag.trust_tier}
                    </span>
                  </div>
                  <p className="text-xs text-[#414b52] mt-1 font-sans">{ag.role}</p>
                  <span className="text-[10px] font-mono text-[#526068] mt-0.5 block">{ag.agent_id}</span>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isRevoked
                        ? "bg-[#3d1a1e] text-[#f87171] border border-[#f87171]/40"
                        : "bg-[#142c1f] text-[#4ade80] border border-[#4ade80]/40"
                    }`}
                  >
                    {ag.status}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(ag)}
                    disabled={updatingId === ag.agent_id}
                    className="chassis-key px-2.5 py-1 text-[10px] font-mono font-bold text-[#181e22]"
                  >
                    {isRevoked ? "RESTORE PRIVILEGES" : "REVOKE PRIVILEGES"}
                  </button>
                </div>
              </div>

              {/* Capability Breakdown */}
              <div className="mt-3 pt-3 border-t border-[#cbd0d2] space-y-2 text-[11px] font-mono">
                <div>
                  <span className="text-[#59666f] text-[10px] font-semibold uppercase block">Authorized Resources:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ag.capabilities.allowed_resources.map((res, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#20272b] text-[#f2f4f4] border border-[#141a1d]"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[#59666f] text-[10px] font-semibold uppercase block">Explicitly Prohibited:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ag.explicitly_denied_resources.map((res, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#351a1e] text-[#fca5a5] border border-[#f87171]/40"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                {ag.capabilities.allowed_tools && ag.capabilities.allowed_tools.length > 0 && (
                  <div>
                    <span className="text-[#59666f] text-[10px] font-semibold uppercase block">Allowlisted Hardware Tools:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ag.capabilities.allowed_tools.map((tool, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2329] text-[#cbd5e1] border border-[#333d47]"
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
