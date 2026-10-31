"use client";

import React, { useState } from "react";
import { PolicyRule, createApproval } from "../lib/api";
import { Lock, Key, Plus, Check } from "lucide-react";

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
                <span className="engraved-label text-xs font-bold text-[#181e22]">BAY 06 // POLICY VAULT & APPROVALS</span>
                <span className="text-[10px] font-mono text-[#58656d]">DETERMINISTIC RULES</span>
              </div>
              <p className="text-xs text-[#414b52] mt-0.5 font-sans">
                Deterministic security rules and cryptographic HMAC approval token generation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="chassis-key px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 text-[#181e22] self-start sm:self-center"
          >
            <Key className="w-3.5 h-3.5 text-[#f15b22]" />
            <span>GENERATE SIGNED APPROVAL</span>
          </button>
        </div>

        {/* Policy Grid */}
        <div className="bg-[#b6bec2] p-3 rounded-lg shadow-well border border-[#a2abb0] border-b-white mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {policies.map((pol) => (
            <div
              key={pol.policy_id}
              className="p-4 rounded bg-[#e7eaeb] border border-[#ffffff] border-b-[#9ca5aa] shadow-[0_2px_4px_rgba(0,0,0,0.12)] space-y-2 text-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-[#cbd0d2] pb-1.5">
                <span className="font-bold text-[#181e22]">{pol.policy_id}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    pol.decision === "ALLOW"
                      ? "bg-[#142c1f] text-[#4ade80] border border-[#4ade80]/40"
                      : "bg-[#362514] text-[#fbbf24] border border-[#fbbf24]/40"
                  }`}
                >
                  {pol.decision}
                </span>
              </div>
              <h3 className="font-sans font-bold text-sm text-[#181e22]">{pol.name}</h3>
              <p className="font-sans text-xs text-[#414b52]">{pol.description}</p>

              <div className="pt-2 border-t border-[#cbd0d2] text-[10px] text-[#526068] space-y-1">
                <div>SOURCE PATTERN: <span className="text-[#181e22]">{pol.source_pattern}</span></div>
                <div>OPERATION: <span className="text-[#181e22]">{pol.operation}</span></div>
                <div>RESOURCE SCOPE: <span className="text-[#181e22]">{pol.resource_pattern}</span></div>
                {pol.destination_pattern && <div>DESTINATION: <span className="text-[#181e22]">{pol.destination_pattern}</span></div>}
                {pol.requires_verifiable_approval && (
                  <div className="text-[#f15b22] font-bold flex items-center space-x-1 mt-1">
                    <span className="lamp-orange"></span>
                    <span>REQUIRES VERIFIABLE HMAC APPROVAL TOKEN</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Token Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#cbd0d2] border-2 border-[#b0b8bc] rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <span className="chassis-screw absolute top-3 left-3"></span>
            <span className="chassis-screw absolute top-3 right-3"></span>

            <div className="flex items-center justify-between pb-3 border-b border-[#a4adb2] px-2">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-[#f15b22]" />
                <h3 className="text-sm font-bold text-[#181e22] uppercase tracking-wide font-mono">
                  KEY-SWITCH // ISSUE VERIFIABLE APPROVAL TOKEN
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIssuedToken(null);
                }}
                className="text-[#5b6871] hover:text-[#181e22] font-mono text-sm"
              >
                [X]
              </button>
            </div>

            {issuedToken ? (
              <div className="recessed-screen p-4 space-y-3 text-xs font-mono">
                <div className="flex items-center space-x-2 text-[#4ade80] font-bold">
                  <Check className="w-4 h-4" />
                  <span>TOKEN CRYPTOGRAPHICALLY SIGNED & REGISTERED</span>
                </div>
                <div className="text-[11px] text-[#d8dee1] space-y-1.5 break-all pt-2 border-t border-[#2d373d]">
                  <div>ID: <span className="text-[#f2f4f4] font-bold">{issuedToken.approval_id}</span></div>
                  <div>ACTOR: {issuedToken.actor}</div>
                  <div>AGENT: {issuedToken.target_agent_id}</div>
                  <div>SCOPE: {issuedToken.scope_resource}</div>
                  <div>EXPIRES: {issuedToken.expires_at}</div>
                  <div>HMAC SIGNATURE: <span className="text-[#f15b22] text-[10px]">{issuedToken.hmac_signature}</span></div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIssuedToken(null);
                  }}
                  className="chassis-key w-full py-2 text-xs font-bold uppercase tracking-wider text-[#181e22] mt-3"
                >
                  DISMISS TERMINAL
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApproval} className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-[#414b52] font-semibold block mb-1">Administrative Actor Authority</label>
                  <input
                    type="text"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#20272b] border border-[#141a1d] rounded text-[#f2f4f4] focus:outline-none focus:ring-1 focus:ring-[#f15b22]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#414b52] font-semibold block mb-1">Target Agent URI</label>
                    <input
                      type="text"
                      value={targetAgentId}
                      onChange={(e) => setTargetAgentId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#20272b] border border-[#141a1d] rounded text-[#f2f4f4] text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#414b52] font-semibold block mb-1">Operation</label>
                    <select
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#20272b] border border-[#141a1d] rounded text-[#f2f4f4]"
                    >
                      <option value="READ">READ</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="TOOL_CALL">TOOL_CALL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#414b52] font-semibold block mb-1">Scope Resource Pattern</label>
                  <input
                    type="text"
                    value={scopeResource}
                    onChange={(e) => setScopeResource(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#20272b] border border-[#141a1d] rounded text-[#f2f4f4] text-[11px]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#414b52] font-semibold block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-[#20272b] border border-[#141a1d] rounded text-[#f2f4f4]"
                    min="1"
                    max="1440"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#a4adb2]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="chassis-key px-4 py-2 text-xs font-bold text-[#414b52]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="chassis-key px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#181e22]"
                  >
                    {isSubmitting ? "SIGNING..." : "COMMIT HMAC TOKEN"}
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
