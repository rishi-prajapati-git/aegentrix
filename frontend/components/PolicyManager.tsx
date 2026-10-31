"use client";

import React, { useState } from "react";
import { PolicyRule, createApproval } from "../lib/api";
import { Lock, Key, ShieldCheck, Check, AlertCircle, Plus } from "lucide-react";

interface PolicyManagerProps {
  policies: PolicyRule[];
  onApprovalCreated: () => void;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({ policies, onApprovalCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [actor, setActor] = useState("admin://sec-ops-lead");
  const [targetAgentId, setTargetAgentId] = useState("agent://research-01");
  const [scopeResource, setScopeResource] = useState("res://finance/q3_summary");
  const [operation, setOperation] = useState("READ");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(60);
  const [issuedToken, setIssuedToken] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createApproval({
        actor,
        target_agent_id: targetAgentId,
        scope_resource: scopeResource,
        operation,
        destination: destination || undefined,
        duration_minutes: Number(duration),
      });
      setIssuedToken(res);
      onApprovalCreated();
    } catch (err: any) {
      alert("Failed to issue approval token: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
          <div>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Policy Rules & Cryptographic Approvals</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic security rules governing resource reads, data transfers, and tool boundaries.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Signed Approval</span>
          </button>
        </div>

        {/* Policies List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {policies.map((pol) => (
            <div
              key={pol.policy_id}
              className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">{pol.policy_id}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    pol.decision === "ALLOW"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {pol.decision}
                </span>
              </div>
              <h3 className="font-semibold text-slate-200">{pol.name}</h3>
              <p className="text-slate-400 text-[11px]">{pol.description}</p>

              <div className="pt-2 border-t border-slate-800/80 font-mono text-[10px] text-slate-300 space-y-1">
                <div>Source: {pol.source_pattern}</div>
                <div>Operation: {pol.operation}</div>
                <div>Resource: {pol.resource_pattern}</div>
                {pol.destination_pattern && <div>Destination: {pol.destination_pattern}</div>}
                {pol.requires_verifiable_approval && (
                  <div className="text-amber-400 font-bold">Requires Verifiable Server Approval</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Approval Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Issue Verifiable Administrative Approval Token
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIssuedToken(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {issuedToken ? (
              <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  <span>Approval Token Cryptographically Signed!</span>
                </div>
                <div className="font-mono text-[11px] text-slate-200 space-y-1 break-all">
                  <div>Approval ID: <span className="text-cyan-300">{issuedToken.approval_id}</span></div>
                  <div>Actor: {issuedToken.actor}</div>
                  <div>Target Agent: {issuedToken.target_agent_id}</div>
                  <div>Scope: {issuedToken.scope_resource}</div>
                  <div>Expires At: {issuedToken.expires_at}</div>
                  <div>HMAC Signature: <span className="text-slate-400">{issuedToken.hmac_signature}</span></div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIssuedToken(null);
                  }}
                  className="w-full py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApproval} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Administrative Actor</label>
                  <input
                    type="text"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Target Agent</label>
                    <input
                      type="text"
                      value={targetAgentId}
                      onChange={(e) => setTargetAgentId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Operation</label>
                    <select
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    >
                      <option value="READ">READ</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="TOOL_CALL">TOOL_CALL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Scope Resource Pattern</label>
                  <input
                    type="text"
                    value={scopeResource}
                    onChange={(e) => setScopeResource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                    min="1"
                    max="1440"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg font-semibold hover:bg-cyan-500/30"
                  >
                    {isSubmitting ? "Generating..." : "Sign & Issue Token"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
