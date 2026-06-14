"use client"

import { useState } from "react"
import type { Lead, LeadStatus } from "@/lib/types"
import { PIPELINE_STATUSES, STATUS_CONFIG } from "@/lib/types"
import { updateLead, regenerateMessage } from "@/lib/api"
import { formatPhoneDisplay, formatRelativeDate, getInitials } from "@/lib/utils"
import StatusBadge from "./StatusBadge"
import { IconCopy, IconMessage, IconPhone, IconRefresh, IconX } from "./icons"

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
        if (status === lead.status || saving) return
        setSaving(true)
        try {
            const updated = await updateLead(lead.id, { status })
            onUpdate(updated)
            showToast(`Moved to ${STATUS_CONFIG[status].label}`)
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
            showToast("New message ready")
        } catch {
            showToast("Failed to generate message")
        } finally {
            setRegenerating(false)
        }
    }

    const handleCopy = async () => {
        if (!lead.generatedMessage) return
        try {
            await navigator.clipboard.writeText(lead.generatedMessage)
            setCopied(true)
            showToast("Copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            showToast("Copy failed")
        }
    }

    const handleMarkContacted = async () => {
        if (saving) return
        setSaving(true)
        try {
            const updated = await updateLead(lead.id, { markContacted: true })
            onUpdate(updated)
            showToast("Marked as contacted")
        } catch {
            showToast("Failed to update")
        } finally {
            setSaving(false)
        }
    }

    const phoneDigits = lead.phonenumber.replace(/\D/g, "")
    const smsLink = `sms:${phoneDigits}${lead.generatedMessage ? `&body=${encodeURIComponent(lead.generatedMessage)}` : ""}`

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <aside className="drawer">
                <div className="drawer-handle" />

                {/* Hero */}
                <div className="drawer-hero">
                    <button className="icon-btn drawer-close" onClick={onClose} aria-label="Close">
                        <IconX />
                    </button>
                    <div className="drawer-hero__profile">
                        <div className="drawer-avatar">{getInitials(lead.fullname)}</div>
                        <div>
                            <h2 className="drawer-hero__name">{lead.fullname}</h2>
                            <StatusBadge status={lead.status} size="md" />
                        </div>
                    </div>
                    <div className="drawer-hero__price">
                        <span className="drawer-hero__price-label">Estimate</span>
                        <span className="drawer-hero__price-value">${lead.price}</span>
                    </div>
                </div>

                {/* Sticky quick actions - mobile */}
                <div className="drawer-quick-bar">
                    <a href={`tel:${phoneDigits}`} className="quick-bar-btn">
                        <IconPhone />
                        Call
                    </a>
                    <a href={smsLink} className="quick-bar-btn quick-bar-btn--primary">
                        <IconMessage />
                        Text
                    </a>
                    {lead.generatedMessage && (
                        <button
                            className={`quick-bar-btn ${copied ? "quick-bar-btn--success" : ""}`}
                            onClick={handleCopy}
                        >
                            <IconCopy />
                            {copied ? "Copied" : "Copy"}
                        </button>
                    )}
                </div>

                <div className="drawer-body">
                    <section className="drawer-section drawer-timeline">
                        <div className="timeline-row">
                            <span className="timeline-label">Added</span>
                            <span className="timeline-value">{formatRelativeDate(lead.createdAt)}</span>
                        </div>
                        <div className="timeline-row">
                            <span className="timeline-label">Last contacted</span>
                            <span className="timeline-value">
                                {lead.lastContactedAt
                                    ? formatRelativeDate(lead.lastContactedAt)
                                    : "Not yet"}
                            </span>
                        </div>
                        {lead.scheduledDate && (
                            <div className="timeline-row">
                                <span className="timeline-label">Scheduled day</span>
                                <span className="timeline-value">
                                    {new Date(lead.scheduledDate + "T12:00:00").toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        )}
                        <button
                            className="btn btn-secondary btn-full"
                            onClick={handleMarkContacted}
                            disabled={saving}
                        >
                            Mark as contacted today
                        </button>
                    </section>

                    {/* Status grid */}
                    <section className="drawer-section">
                        <h3 className="drawer-section__title">Update status</h3>
                        <div className="status-grid">
                            {PIPELINE_STATUSES.map((s) => {
                                const cfg = STATUS_CONFIG[s]
                                const active = lead.status === s
                                return (
                                    <button
                                        key={s}
                                        className={`status-pill ${active ? "status-pill--active" : ""}`}
                                        style={
                                            active
                                                ? {
                                                      color: cfg.color,
                                                      background: cfg.bg,
                                                      borderColor: cfg.color,
                                                  }
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
                    </section>

                    {/* Message */}
                    <section className="drawer-section message-section">
                        <div className="drawer-section__row">
                            <h3 className="drawer-section__title">Outreach message</h3>
                            <button
                                className="text-btn"
                                onClick={handleRegenerate}
                                disabled={regenerating}
                            >
                                <IconRefresh className={regenerating ? "spin" : ""} />
                                {regenerating ? "Generating..." : "Regenerate"}
                            </button>
                        </div>
                        {lead.generatedMessage ? (
                            <div className="message-card">
                                <p>{lead.generatedMessage}</p>
                                <button
                                    className={`btn btn-copy-full ${copied ? "copied" : ""}`}
                                    onClick={handleCopy}
                                >
                                    <IconCopy />
                                    {copied ? "Copied!" : "Copy message"}
                                </button>
                            </div>
                        ) : (
                            <div className="empty-message">
                                <p>No message yet for this lead.</p>
                                <button className="btn btn-primary" onClick={handleRegenerate} disabled={regenerating}>
                                    Generate message
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Contact cards */}
                    <section className="drawer-section">
                        <h3 className="drawer-section__title">Contact</h3>
                        <div className="info-cards">
                            <a href={`tel:${phoneDigits}`} className="info-card info-card--link">
                                <span className="info-card__label">Phone</span>
                                <span className="info-card__value">{formatPhoneDisplay(lead.phonenumber)}</span>
                            </a>
                            <a href={`mailto:${lead.email}`} className="info-card info-card--link">
                                <span className="info-card__label">Email</span>
                                <span className="info-card__value">{lead.email}</span>
                            </a>
                            <div className="info-card">
                                <span className="info-card__label">Address</span>
                                <span className="info-card__value">{lead.homeaddress}</span>
                            </div>
                            <div className="info-card">
                                <span className="info-card__label">Location</span>
                                <span className="info-card__value">
                                    {lead.city}{lead.zipcode ? `, ${lead.zipcode}` : ""}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Job details */}
                    <section className="drawer-section">
                        <h3 className="drawer-section__title">Job details</h3>
                        <div className="detail-chips">
                            <span className="detail-chip">{lead.numberofpanels} panels</span>
                            <span className="detail-chip">{lead.stories}</span>
                            {lead.travelDistanceInMiles != null && lead.travelDistanceInMiles > 0 && (
                                <span className="detail-chip">
                                    {lead.travelDistanceInMiles} mi · {lead.travelDuration}
                                </span>
                            )}
                            {lead.source && <span className="detail-chip">{lead.source}</span>}
                            {lead.utmCampaign && (
                                <span className="detail-chip">{lead.utmCampaign}</span>
                            )}
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="drawer-section">
                        <h3 className="drawer-section__title">Team notes</h3>
                        <textarea
                            className="notes-input"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add context for your team..."
                            rows={4}
                        />
                        <button
                            className="btn btn-secondary btn-full"
                            onClick={handleSaveNotes}
                            disabled={saving || notes === (lead.notes || "")}
                        >
                            Save notes
                        </button>
                    </section>
                </div>
            </aside>
        </>
    )
}
