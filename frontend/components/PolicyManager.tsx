"use client";

import React, { useState } from "react";
import { PolicyRule, createApproval } from "../lib/api";
import { Lock, Key, Plus, Check, Shield } from "lucide-react";

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#48404b]">
              Bay 06 // Policy Vault & Approvals
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ded0f9] text-[#383139]">
              DETERMINISTIC RULES
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#383139] mt-0.5">
            Security Policy Rules & Tokens
          </h2>
          <p className="text-xs sm:text-sm text-[#48404b] mt-0.5">
            Deterministic security rules and cryptographic HMAC approval token generation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold flex items-center space-x-2 self-start sm:self-center"
        >
          <Key className="w-4 h-4 text-[#f6a3ca]" />
          <span>Issue Signed Approval</span>
        </button>
      </div>

      {/* Policy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((pol) => (
          <div
            key={pol.policy_id}
            className="p-6 rounded-[32px] bg-[#fffdf7] shadow-[0_12px_24px_-6px_rgba(56,49,57,0.08),inset_3px_3px_6px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(56,49,57,0.07)] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#383139]/10 pb-2">
              <span className="font-mono font-bold text-xs text-[#383139]">
                {pol.policy_id}
              </span>
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  pol.decision === "ALLOW"
                    ? "bg-[#c0efdc] text-[#245842]"
                    : "bg-[#f9e7a8] text-[#6b5816]"
                }`}
              >
                {pol.decision}
              </span>
            </div>

            <h3 className="font-bold text-base text-[#383139]">
              {pol.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#48404b] leading-relaxed">
              {pol.description}
            </p>

            <div className="pt-2 border-t border-[#383139]/10 text-xs text-[#48404b] space-y-1 font-mono">
              <div>Source: <span className="font-bold text-[#383139]">{pol.source_pattern}</span></div>
              <div>Operation: <span className="font-bold text-[#383139]">{pol.operation}</span></div>
              <div>Resource Scope: <span className="font-bold text-[#383139]">{pol.resource_pattern}</span></div>
              {pol.destination_pattern && (
                <div>Destination: <span className="font-bold text-[#383139]">{pol.destination_pattern}</span></div>
              )}
              {pol.requires_verifiable_approval && (
                <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f6a3ca]/30 text-[#78234e] text-xs font-bold">
                  <span className="recessed-dot recessed-dot-orange"></span>
                  <span>Requires HMAC Verifiable Approval Token</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Admin Token Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#383139]/40 backdrop-blur-sm p-4">
          <div className="clay-cushion-cream p-6 sm:p-8 max-w-lg w-full space-y-5 rounded-[40px] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#383139]/10">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#f6a3ca] flex items-center justify-center shadow-inner">
                  <Key className="w-4 h-4 text-[#383139]" />
                </div>
                <h3 className="text-base font-bold text-[#383139]">
                  Issue Verifiable Approval Token
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIssuedToken(null);
                }}
                className="w-8 h-8 rounded-full bg-[#f1f2fa] flex items-center justify-center text-sm font-bold text-[#383139] hover:bg-white shadow-sm"
              >
                ✕
              </button>
            </div>

            {issuedToken ? (
              <div className="clay-recessed p-5 rounded-[25px] space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-[#245842] font-bold text-sm">
                  <Check className="w-5 h-5 text-[#245842]" />
                  <span>Token Cryptographically Signed & Registered</span>
                </div>
                <div className="text-xs text-[#383139] space-y-1.5 break-all pt-2 border-t border-[#383139]/10 font-mono">
                  <div>ID: <span className="font-bold">{issuedToken.approval_id}</span></div>
                  <div>Actor: {issuedToken.actor}</div>
                  <div>Target Agent: {issuedToken.target_agent_id}</div>
                  <div>Resource Scope: {issuedToken.scope_resource}</div>
                  <div>Operation: {issuedToken.operation}</div>
                  <div>Valid Until: {new Date(issuedToken.expires_at).toLocaleTimeString()}</div>
                  <div className="p-2 rounded bg-white/70 text-[11px] font-bold text-[#383139] shadow-inner mt-2">
                    Signature: {issuedToken.signature}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setIssuedToken(null);
                  }}
                  className="clay-btn clay-btn-primary w-full py-2.5 mt-3 text-xs font-bold"
                >
                  Close & Return
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApproval} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#48404b] block mb-1">
                    Actor Identity:
                  </label>
                  <input
                    type="text"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white rounded-full text-xs sm:text-sm font-mono text-[#383139] shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#48404b] block mb-1">
                    Target Agent ID:
                  </label>
                  <input
                    type="text"
                    value={targetAgentId}
                    onChange={(e) => setTargetAgentId(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white rounded-full text-xs sm:text-sm font-mono text-[#383139] shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#48404b] block mb-1">
                    Resource Scope URI:
                  </label>
                  <input
                    type="text"
                    value={scopeResource}
                    onChange={(e) => setScopeResource(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white rounded-full text-xs sm:text-sm font-mono text-[#383139] shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#48404b] block mb-1">
                      Operation:
                    </label>
                    <select
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-full text-xs font-mono text-[#383139] shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
                    >
                      <option value="READ">READ</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="EXECUTE">EXECUTE</option>
                      <option value="QUERY">QUERY</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#48404b] block mb-1">
                      Duration (Mins):
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={1}
                      max={1440}
                      className="w-full px-4 py-2 bg-white rounded-full text-xs font-mono text-[#383139] shadow-[inset_1px_1px_3px_rgba(56,49,57,0.1)] focus:outline-none focus:ring-2 focus:ring-[#383139]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="clay-btn clay-btn-cream px-4 py-2 text-xs font-bold text-[#48404b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="clay-btn clay-btn-primary px-5 py-2 text-xs font-bold"
                  >
                    {isSubmitting ? "Generating HMAC..." : "Cryptographically Sign"}
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
