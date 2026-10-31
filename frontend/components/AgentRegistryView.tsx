"use client";

import React, { useState } from "react";
import { AgentModel, updateAgentStatus } from "../lib/api";
import { Users, Shield, Check, X, Ban, Cpu } from "lucide-react";

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
      await updateAgentStatus(agent.agent_id, newStatus, "Status toggled via Claymorphism SOC console");
      onRefresh();
    } catch (err) {
      alert("Failed to update agent status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#48404b]">
              Bay 05 // Agent Registry Matrix
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#c0efdc] text-[#245842]">
              AUTHORITATIVE STORE
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#383139] mt-0.5">
            Identity & Capability Deck
          </h2>
          <p className="text-xs sm:text-sm text-[#48404b] mt-0.5">
            Authoritative identity store, trust tier assignments, and least-privilege capability boundaries.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="clay-btn clay-btn-cream px-4 py-2 text-xs font-bold text-[#383139] self-start sm:self-center"
        >
          Sync Registry
        </button>
      </div>

      {/* Grid of Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((ag) => {
          const isRevoked = ag.status === "REVOKED";
          return (
            <div
              key={ag.agent_id}
              className={`p-6 rounded-[32px] transition-all shadow-[0_12px_24px_-6px_rgba(56,49,57,0.08),inset_3px_3px_6px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(56,49,57,0.07)] ${
                isRevoked
                  ? "bg-[#fffdf7] border-2 border-[#f6a3ca]"
                  : "bg-[#fffdf7]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#ded0f9] flex items-center justify-center flex-shrink-0 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),inset_-1px_-1px_3px_rgba(125,107,163,0.3)]">
                    <Cpu className="w-5 h-5 text-[#383139]" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`recessed-dot ${
                          isRevoked ? "recessed-dot-orange" : "recessed-dot-green"
                        }`}
                      ></span>
                      <h3 className="text-base font-bold text-[#383139]">
                        {ag.name}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ded0f9] text-[#383139] uppercase">
                        {ag.trust_tier}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#48404b] mt-1 font-medium">
                      {ag.role}
                    </p>
                    <span className="text-xs font-mono text-[#48404b]/80 mt-0.5 block">
                      {ag.agent_id}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      isRevoked
                        ? "bg-[#f6a3ca] text-[#78234e]"
                        : "bg-[#c0efdc] text-[#245842]"
                    }`}
                  >
                    {ag.status}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(ag)}
                    disabled={updatingId === ag.agent_id}
                    className={`clay-btn px-3 py-1.5 text-xs font-bold ${
                      isRevoked
                        ? "clay-btn-mint text-[#245842]"
                        : "clay-btn-accent text-[#78234e]"
                    }`}
                  >
                    {isRevoked ? "Restore Privileges" : "Revoke Privileges"}
                  </button>
                </div>
              </div>

              {/* Capability Breakdown */}
              <div className="mt-4 pt-4 border-t border-[#383139]/10 space-y-3 text-xs">
                <div>
                  <span className="text-[#48404b] text-[11px] font-bold uppercase block mb-1">
                    Authorized Resources:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ag.capabilities.allowed_resources.map((res, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#c0efdc] text-[#245842] font-semibold shadow-sm"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[#48404b] text-[11px] font-bold uppercase block mb-1">
                    Explicitly Prohibited:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ag.explicitly_denied_resources.map((res, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#f6a3ca] text-[#78234e] font-semibold shadow-sm"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                {ag.capabilities.allowed_tools && ag.capabilities.allowed_tools.length > 0 && (
                  <div>
                    <span className="text-[#48404b] text-[11px] font-bold uppercase block mb-1">
                      Allowlisted Tools:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ag.capabilities.allowed_tools.map((tool, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-[#c5e5fb] text-[#204968] font-semibold shadow-sm"
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
