"use client"

import { useState } from "react"
import type { Lead, LeadStatus } from "@/lib/types"
import { PIPELINE_STATUSES, STATUS_CONFIG } from "@/lib/types"
import { updateLead, regenerateMessage } from "@/lib/api"
import StatusBadge from "./StatusBadge"

interface LeadDetailProps {
    lead: Lead
    onClose: () => void
    onUpdate: (lead: Lead) => void
    showToast: (msg: string) => void
}

export default function LeadDetail({
    lead,
    onClose,
    onUpdate,
    showToast,
}: LeadDetailProps) {
    const [notes, setNotes] = useState(lead.notes || "")
    const [saving, setSaving] = useState(false)
    const [regenerating, setRegenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleStatusChange = async (status: LeadStatus) => {
        setSaving(true)
        try {
            const updated = await updateLead(lead.id, { status })
            onUpdate(updated)
            showToast(`Status → ${STATUS_CONFIG[status].label}`)
        } catch {
            showToast("Failed to update status")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveNotes = async () => {
        setSaving(true)
        try {
            const updated = await updateLead(lead.id, { notes })
            onUpdate(updated)
            showToast("Notes saved")
        } catch {
            showToast("Failed to save notes")
        } finally {
            setSaving(false)
        }
    }

    const handleRegenerate = async () => {
        setRegenerating(true)
        try {
            const updated = await regenerateMessage(lead.id, lead.status)
            onUpdate(updated)
            showToast("Message regenerated")
        } catch {
            showToast("Failed to regenerate message")
        } finally {
            setRegenerating(false)
        }
    }

    const handleCopy = async () => {
        if (!lead.generatedMessage) return
        try {
            await navigator.clipboard.writeText(lead.generatedMessage)
            setCopied(true)
            showToast("Copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            const textarea = document.createElement("textarea")
            textarea.value = lead.generatedMessage
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand("copy")
            document.body.removeChild(textarea)
            setCopied(true)
            showToast("Copied!")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const phoneDigits = lead.phonenumber.replace(/\D/g, "")
    const smsLink = `sms:${phoneDigits}${lead.generatedMessage ? `&body=${encodeURIComponent(lead.generatedMessage)}` : ""}`

    return (
        <>
            <div className="detail-overlay" onClick={onClose} />
            <div className="detail-panel">
                <div className="detail-handle" />
                <div className="detail-header">
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{lead.fullname}</div>
                        <StatusBadge status={lead.status} />
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: "8px 14px", minHeight: "auto" }}
                    >
                        ✕
                    </button>
                </div>

                <div className="detail-body">
                    <div className="detail-section">
                        <h3>Pipeline</h3>
                        <div className="pipeline">
                            {PIPELINE_STATUSES.map((s) => {
                                const cfg = STATUS_CONFIG[s]
                                const isCurrent = lead.status === s
                                return (
                                    <button
                                        key={s}
                                        className={`pipeline-step ${isCurrent ? "current active" : ""}`}
                                        style={
                                            isCurrent
                                                ? { color: cfg.color, background: cfg.bg }
                                                : undefined
                                        }
                                        onClick={() => handleStatusChange(s)}
                                        disabled={saving}
                                    >
                                        {cfg.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Outreach Message</h3>
                        {lead.generatedMessage ? (
                            <>
                                <div className="message-box">{lead.generatedMessage}</div>
                                <div className="action-row" style={{ marginTop: 12 }}>
                                    <button
                                        className={`btn btn-copy ${copied ? "copied" : ""}`}
                                        onClick={handleCopy}
                                    >
                                        {copied ? "✓ Copied!" : "📋 Copy Message"}
                                    </button>
                                </div>
                                <div className="action-row" style={{ marginTop: 8 }}>
                                    <a
                                        href={smsLink}
                                        className="btn btn-primary"
                                        style={{ flex: 1, textAlign: "center" }}
                                    >
                                        💬 Open in Messages
                                    </a>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleRegenerate}
                                        disabled={regenerating}
                                    >
                                        {regenerating ? "..." : "↻ Regenerate"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div>
                                <p
                                    style={{
                                        color: "var(--text-secondary)",
                                        fontSize: 14,
                                        marginBottom: 12,
                                    }}
                                >
                                    No message generated yet.
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleRegenerate}
                                    disabled={regenerating}
                                >
                                    {regenerating ? "Generating..." : "Generate Message"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="detail-section">
                        <h3>Contact</h3>
                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>Phone</label>
                                <a href={`tel:${phoneDigits}`} className="value">
                                    {lead.phonenumber}
                                </a>
                            </div>
                            <div className="detail-field">
                                <label>Email</label>
                                <a href={`mailto:${lead.email}`} className="value">
                                    {lead.email}
                                </a>
                            </div>
                            <div className="detail-field">
                                <label>Address</label>
                                <div className="value">{lead.homeaddress}</div>
                            </div>
                            <div className="detail-field">
                                <label>City / Zip</label>
                                <div className="value">
                                    {lead.city}, {lead.zipcode}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Estimate</h3>
                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>Price</label>
                                <div
                                    className="value"
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: "var(--brand)",
                                    }}
                                >
                                    ${lead.price}
                                </div>
                            </div>
                            <div className="detail-field">
                                <label>Panels / Stories</label>
                                <div className="value">
                                    {lead.numberofpanels} panels · {lead.stories}
                                </div>
                            </div>
                            {lead.travelDistanceInMiles != null &&
                                lead.travelDistanceInMiles > 0 && (
                                    <div className="detail-field">
                                        <label>Travel</label>
                                        <div className="value">
                                            {lead.travelDistanceInMiles} mi · {lead.travelDuration}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>

                    {(lead.source || lead.utmCampaign) && (
                        <div className="detail-section">
                            <h3>Campaign</h3>
                            <div className="detail-grid">
                                <div className="detail-field">
                                    <label>Source</label>
                                    <div className="value">{lead.source}</div>
                                </div>
                                {lead.utmCampaign && (
                                    <div className="detail-field">
                                        <label>Campaign</label>
                                        <div className="value">{lead.utmCampaign}</div>
                                    </div>
                                )}
                                {lead.utmMedium && (
                                    <div className="detail-field">
                                        <label>Medium</label>
                                        <div className="value">{lead.utmMedium}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="detail-section">
                        <h3>Notes</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this lead..."
                            rows={3}
                        />
                        <button
                            className="btn btn-secondary"
                            style={{ marginTop: 8 }}
                            onClick={handleSaveNotes}
                            disabled={saving || notes === (lead.notes || "")}
                        >
                            Save Notes
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
