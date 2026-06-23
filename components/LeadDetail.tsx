"use client"

import { useEffect, useRef, useState } from "react"
import type { Lead, LeadStatus } from "@/lib/types"
import { PIPELINE_STATUSES, STATUS_CONFIG } from "@/lib/types"
import { formatSourceLabel, getSourceTheme } from "@/lib/sources"
import { updateLead, regenerateMessage, pushLeadToGorillaDesk } from "@/lib/api"
import {
    ensureGoogleMapsLoaded,
    parseAddressFromPlace,
    resolveAutocompletePlace,
    SOCAL_BOUNDS,
    validateParsedAddress,
} from "@/lib/googleMaps"
import { formatRelativeDate, getInitials } from "@/lib/utils"
import LeadPrice from "./LeadPrice"
import StatusBadge from "./StatusBadge"
import { IconCopy, IconMessage, IconPhone, IconRefresh, IconX } from "./icons"

const STORY_OPTIONS = ["Single Story", "Two Story", "Ground Mounted"] as const

interface LeadInfoForm {
    fullname: string
    phonenumber: string
    email: string
    homeaddress: string
    city: string
    zipcode: string
    numberofpanels: string
    stories: string
}

function leadToInfoForm(lead: Lead): LeadInfoForm {
    return {
        fullname: lead.fullname || "",
        phonenumber: lead.phonenumber || "",
        email: lead.email || "",
        homeaddress: lead.homeaddress || "",
        city: lead.city || "",
        zipcode: lead.zipcode || "",
        numberofpanels: lead.numberofpanels ? String(lead.numberofpanels) : "",
        stories: lead.stories || "Single Story",
    }
}

function infoFormMatchesLead(form: LeadInfoForm, lead: Lead): boolean {
    const current = leadToInfoForm(lead)
    return (Object.keys(current) as (keyof LeadInfoForm)[]).every(
        (key) => form[key] === current[key]
    )
}

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
    const [infoForm, setInfoForm] = useState<LeadInfoForm>(() => leadToInfoForm(lead))
    const [saving, setSaving] = useState(false)
    const [savingInfo, setSavingInfo] = useState(false)
    const [regenerating, setRegenerating] = useState(false)
    const [pushingToGorillaDesk, setPushingToGorillaDesk] = useState(false)
    const [copied, setCopied] = useState(false)
    const [addressVerified, setAddressVerified] = useState(() => !!lead.homeaddress?.trim())
    const [addressFieldError, setAddressFieldError] = useState("")
    const [mapsLoadError, setMapsLoadError] = useState("")

    const addressInputRef = useRef<HTMLInputElement>(null)
    const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const addressSelectingRef = useRef(false)
    const addressFromListRef = useRef(!!lead.homeaddress?.trim())

    useEffect(() => {
        setNotes(lead.notes || "")
        setInfoForm(leadToInfoForm(lead))
        const hasAddress = !!lead.homeaddress?.trim()
        setAddressVerified(hasAddress)
        addressFromListRef.current = hasAddress
        setAddressFieldError("")
    }, [lead])

    useEffect(() => {
        const markAutocompleteSelecting = (event: MouseEvent | TouchEvent) => {
            const target = event.target as HTMLElement | null
            if (!target?.closest?.(".pac-container")) return
            addressSelectingRef.current = true
        }

        document.addEventListener("mousedown", markAutocompleteSelecting)
        document.addEventListener("touchstart", markAutocompleteSelecting)
        return () => {
            document.removeEventListener("mousedown", markAutocompleteSelecting)
            document.removeEventListener("touchstart", markAutocompleteSelecting)
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        ensureGoogleMapsLoaded()
            .then(() => {
                if (cancelled) return
                setMapsLoadError("")
                const input = addressInputRef.current
                if (!input || !window.google?.maps?.places || addressAutocompleteRef.current) {
                    return
                }

                const autocomplete = new window.google.maps.places.Autocomplete(input, {
                    componentRestrictions: { country: "us" },
                    bounds: SOCAL_BOUNDS,
                    strictBounds: true,
                    fields: ["address_components", "formatted_address", "place_id"],
                    types: ["address"],
                })
                addressAutocompleteRef.current = autocomplete

                autocomplete.addListener("place_changed", () => {
                    void (async () => {
                        addressSelectingRef.current = true
                        try {
                            const place = await resolveAutocompletePlace(
                                autocomplete.getPlace()
                            )
                            if (!place?.address_components?.length) return

                            const parsed = parseAddressFromPlace(place)
                            const validationError = validateParsedAddress(parsed)
                            if (validationError) {
                                setAddressVerified(false)
                                addressFromListRef.current = false
                                setAddressFieldError(validationError)
                                return
                            }

                            setInfoForm((prev) => ({
                                ...prev,
                                homeaddress: parsed.fullAddress,
                                city: parsed.city,
                                zipcode: parsed.zipcode,
                            }))
                            setAddressVerified(true)
                            addressFromListRef.current = true
                            setAddressFieldError("")
                        } finally {
                            window.setTimeout(() => {
                                addressSelectingRef.current = false
                            }, 0)
                        }
                    })()
                })
            })
            .catch((error) => {
                console.error("Google Maps failed to load:", error)
                if (!cancelled) {
                    setMapsLoadError(
                        "Address autocomplete is unavailable on this site. Add https://scsp-dashboard.vercel.app/* to your Google Maps API key referrers, confirm NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in Vercel, then redeploy."
                    )
                }
            })

        return () => {
            cancelled = true
            if (addressAutocompleteRef.current && window.google?.maps?.event) {
                window.google.maps.event.clearInstanceListeners(
                    addressAutocompleteRef.current
                )
                addressAutocompleteRef.current = null
            }
        }
    }, [])

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

    const handleInfoChange =
        (field: keyof LeadInfoForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setInfoForm((prev) => ({ ...prev, [field]: e.target.value }))
        }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (addressSelectingRef.current) return

        setInfoForm((prev) => ({
            ...prev,
            homeaddress: e.target.value,
            city: "",
            zipcode: "",
        }))
        setAddressVerified(false)
        addressFromListRef.current = false
        setAddressFieldError("")
    }

    const handleSaveInfo = async () => {
        const panels = parseInt(infoForm.numberofpanels, 10)
        const homeTrim = infoForm.homeaddress.trim()
        const savedHome = (lead.homeaddress || "").trim()
        const addressChanged = homeTrim !== savedHome

        if (!infoForm.fullname.trim()) {
            showToast("Name is required")
            return
        }
        if (!panels || panels <= 0) {
            showToast("Enter a valid panel count")
            return
        }
        if (homeTrim && addressChanged && !addressFromListRef.current) {
            showToast("Select the address from Google suggestions")
            setAddressFieldError("Tap the address from the Google list to confirm.")
            return
        }

        setSavingInfo(true)
        try {
            const updated = await updateLead(lead.id, {
                fullname: infoForm.fullname.trim(),
                phonenumber: infoForm.phonenumber.trim(),
                email: infoForm.email.trim(),
                homeaddress: infoForm.homeaddress.trim(),
                city: infoForm.city.trim(),
                zipcode: infoForm.zipcode.trim(),
                numberofpanels: panels,
                stories: infoForm.stories,
            })
            onUpdate(updated)
            showToast("Lead info saved")
        } catch {
            showToast("Failed to save lead info")
        } finally {
            setSavingInfo(false)
        }
    }

    const infoDirty = !infoFormMatchesLead(infoForm, lead)

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

    const isInGorillaDesk = !!lead.gorillaDeskCustomerId
    const canPushToGorillaDesk =
        !isInGorillaDesk &&
        !!lead.fullname?.trim() &&
        !!lead.phonenumber?.trim() &&
        !!lead.city?.trim()

    const handlePushToGorillaDesk = async () => {
        if (pushingToGorillaDesk || isInGorillaDesk || !canPushToGorillaDesk) return
        setPushingToGorillaDesk(true)
        try {
            const result = await pushLeadToGorillaDesk(lead.id)
            onUpdate(result.lead)
            showToast(
                result.alreadySynced
                    ? "Already in GorillaDesk"
                    : "Lead pushed to GorillaDesk"
            )
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to push to GorillaDesk"
            showToast(message)
        } finally {
            setPushingToGorillaDesk(false)
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
                        <LeadPrice lead={lead} variant="hero" />
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

                    {/* Customer info — editable */}
                    <section className="drawer-section">
                        <h3 className="drawer-section__title">Customer info</h3>
                        <p className="lead-edit-hint">
                            Add or update the address after you reach out — start typing and
                            pick from the Google suggestions.
                        </p>
                        {mapsLoadError ? (
                            <p className="lead-address-error">{mapsLoadError}</p>
                        ) : null}
                        <div className="lead-edit-form">
                            <label className="field">
                                <span className="field__label">Full name</span>
                                <input
                                    type="text"
                                    value={infoForm.fullname}
                                    onChange={handleInfoChange("fullname")}
                                    autoComplete="off"
                                />
                            </label>
                            <label className="field">
                                <span className="field__label">Phone</span>
                                <input
                                    type="tel"
                                    value={infoForm.phonenumber}
                                    onChange={handleInfoChange("phonenumber")}
                                    autoComplete="off"
                                />
                            </label>
                            <label className="field">
                                <span className="field__label">Email</span>
                                <input
                                    type="email"
                                    value={infoForm.email}
                                    onChange={handleInfoChange("email")}
                                    autoComplete="off"
                                />
                            </label>
                            <label className="field">
                                <span className="field__label">Home address</span>
                                <div
                                    className={`lead-address-input-wrap${
                                        addressVerified ? " lead-address-input-wrap--verified" : ""
                                    }`}
                                >
                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        value={infoForm.homeaddress}
                                        onChange={handleAddressChange}
                                        placeholder="Start typing, then pick from Google"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        spellCheck={false}
                                    />
                                    {addressVerified ? (
                                        <span className="lead-address-check" aria-hidden>
                                            ✓
                                        </span>
                                    ) : null}
                                </div>
                                {addressFieldError ? (
                                    <p className="lead-address-error">{addressFieldError}</p>
                                ) : addressVerified && infoForm.homeaddress ? (
                                    <p className="lead-address-verified">
                                        ✓ {infoForm.city}
                                        {infoForm.zipcode ? `, ${infoForm.zipcode}` : ""}
                                    </p>
                                ) : null}
                            </label>
                            <div className="lead-edit-form__row">
                                <label className="field">
                                    <span className="field__label">City</span>
                                    <input
                                        type="text"
                                        value={infoForm.city}
                                        onChange={handleInfoChange("city")}
                                        autoComplete="off"
                                    />
                                </label>
                                <label className="field">
                                    <span className="field__label">ZIP</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={infoForm.zipcode}
                                        onChange={handleInfoChange("zipcode")}
                                        autoComplete="off"
                                    />
                                </label>
                            </div>
                            <div className="lead-edit-form__row">
                                <label className="field">
                                    <span className="field__label">Panels</span>
                                    <input
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        value={infoForm.numberofpanels}
                                        onChange={handleInfoChange("numberofpanels")}
                                    />
                                </label>
                                <label className="field">
                                    <span className="field__label">Stories</span>
                                    <select
                                        value={infoForm.stories}
                                        onChange={handleInfoChange("stories")}
                                    >
                                        {STORY_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-full"
                            onClick={handleSaveInfo}
                            disabled={savingInfo || !infoDirty}
                        >
                            {savingInfo ? "Saving..." : "Save customer info"}
                        </button>
                    </section>

                    {/* Job meta (read-only) */}
                    <section className="drawer-section">
                        <h3 className="drawer-section__title">Job details</h3>
                        <div className="detail-chips">
                            {lead.travelDistanceInMiles != null && lead.travelDistanceInMiles > 0 && (
                                <span className="detail-chip">
                                    {lead.travelDistanceInMiles} mi · {lead.travelDuration}
                                </span>
                            )}
                            {(() => {
                                const theme = getSourceTheme(lead.source)
                                return (
                                    <span
                                        className="detail-chip"
                                        style={{
                                            background: theme.bg,
                                            color: theme.color,
                                            borderColor: theme.border,
                                        }}
                                    >
                                        {formatSourceLabel(lead.source)}
                                    </span>
                                )
                            })()}
                            {lead.discountApplied &&
                                lead.discountedPrice != null &&
                                lead.discountedPrice < lead.price && (
                                    <span className="detail-chip detail-chip--discount">
                                        ${lead.discountAmount ?? lead.price - lead.discountedPrice} off
                                        · ${lead.discountedPrice} final
                                        {lead.discountReason ? ` · ${lead.discountReason}` : ""}
                                    </span>
                                )}
                            {lead.utmCampaign && (
                                <span className="detail-chip">{lead.utmCampaign}</span>
                            )}
                            {isInGorillaDesk && (
                                <span className="detail-chip detail-chip--success">
                                    In GorillaDesk
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-full"
                            style={{ marginTop: 12 }}
                            onClick={handlePushToGorillaDesk}
                            disabled={pushingToGorillaDesk || isInGorillaDesk || !canPushToGorillaDesk}
                            title={
                                isInGorillaDesk
                                    ? "This lead is already in GorillaDesk"
                                    : !canPushToGorillaDesk
                                      ? "Add name, phone, and city before pushing"
                                      : "Create this lead in GorillaDesk"
                            }
                        >
                            {pushingToGorillaDesk
                                ? "Pushing to GorillaDesk…"
                                : isInGorillaDesk
                                  ? "In GorillaDesk ✓"
                                  : "Push to GorillaDesk"}
                        </button>
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
