"use client"

import { useEffect, useRef, useState } from "react"
import {
    calculateQuote,
    generateSeasonalOffer,
    getSixMonthProgramOffer,
    savePhoneQuote,
} from "@/lib/api"
import type { Lead, PhoneQuoteOutcome, QuoteCloseOffer, QuoteResult } from "@/lib/types"
import { IconCopy, IconRefresh } from "./icons"

const STORY_OPTIONS = ["Single Story", "Two Story", "Ground Mounted"] as const

const CITY_SUGGESTIONS = [
    "Temecula",
    "Murrieta",
    "Menifee",
    "Lake Elsinore",
    "Wildomar",
    "Hemet",
    "Corona",
    "Riverside",
    "Moreno Valley",
    "Perris",
    "Canyon Lake",
    "French Valley",
    "Sun City",
    "Temescal Valley",
]

interface TeamQuoteProps {
    onLeadSaved: (lead: Lead) => void
    showToast: (message: string) => void
}

type OutcomeStep = PhoneQuoteOutcome | null

export default function TeamQuote({ onLeadSaved, showToast }: TeamQuoteProps) {
    const [panels, setPanels] = useState("")
    const [city, setCity] = useState("")
    const [stories, setStories] = useState<(typeof STORY_OPTIONS)[number]>("Single Story")
    const [quote, setQuote] = useState<QuoteResult | null>(null)
    const [activeOffer, setActiveOffer] = useState<QuoteCloseOffer | null>(null)
    const [sixMonthOffer, setSixMonthOffer] = useState<QuoteCloseOffer | null>(null)
    const [seasonalOffer, setSeasonalOffer] = useState<QuoteCloseOffer | null>(null)
    const [outcomeStep, setOutcomeStep] = useState<OutcomeStep>(null)
    const [loadingQuote, setLoadingQuote] = useState(false)
    const [loadingSeasonal, setLoadingSeasonal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fullname, setFullname] = useState("")
    const [phonenumber, setPhonenumber] = useState("")
    const [homeaddress, setHomeaddress] = useState("")
    const [notes, setNotes] = useState("")

    const outcomeRef = useRef<HTMLDivElement>(null)
    const closeToolsRef = useRef<HTMLDivElement>(null)

    const closingPrice = activeOffer?.discountedPrice ?? quote?.price ?? null

    const resetOffers = () => {
        setActiveOffer(null)
        setSixMonthOffer(null)
        setSeasonalOffer(null)
    }

    const resetAll = () => {
        setPanels("")
        setCity("")
        setStories("Single Story")
        setQuote(null)
        resetOffers()
        setOutcomeStep(null)
        setFullname("")
        setPhonenumber("")
        setHomeaddress("")
        setNotes("")
    }

    useEffect(() => {
        if (!outcomeStep) return
        outcomeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [outcomeStep])

    const handleCalculate = async (event: React.FormEvent) => {
        event.preventDefault()
        const panelCount = parseInt(panels, 10)

        if (!panelCount || panelCount <= 0) {
            showToast("Enter a valid panel count")
            return
        }
        if (!city.trim()) {
            showToast("Enter the customer's city")
            return
        }

        setLoadingQuote(true)
        setOutcomeStep(null)
        resetOffers()
        setFullname("")
        setPhonenumber("")
        setHomeaddress("")
        setNotes("")

        try {
            const result = await calculateQuote({
                numberofpanels: panelCount,
                stories,
                city: city.trim(),
            })
            setQuote(result)
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not calculate quote")
        } finally {
            setLoadingQuote(false)
        }
    }

    const handleSixMonthOffer = async () => {
        if (!quote) return

        try {
            const offer = await getSixMonthProgramOffer(quote.price)
            setSixMonthOffer(offer)
            setActiveOffer(offer)
            showToast("6-month program price ready")
            closeToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not build program offer")
        }
    }

    const handleSeasonalOffer = async () => {
        if (!quote) return

        setLoadingSeasonal(true)
        try {
            const offer = await generateSeasonalOffer({
                price: quote.price,
                city: quote.city,
                numberofpanels: quote.numberofpanels,
                stories: quote.stories,
            })
            setSeasonalOffer(offer)
            setActiveOffer(offer)
            showToast("Seasonal offer generated")
            closeToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not generate seasonal offer")
        } finally {
            setLoadingSeasonal(false)
        }
    }

    const copyPitch = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            showToast("Copied to clipboard")
        } catch {
            showToast("Could not copy text")
        }
    }

    const startOutcome = (step: PhoneQuoteOutcome) => {
        setOutcomeStep(step)
    }

    const handleSaveOutcome = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!quote || !outcomeStep || closingPrice == null) return

        setSaving(true)
        try {
            const hasDiscount = !!activeOffer

            const lead = await savePhoneQuote({
                outcome: outcomeStep,
                fullname: fullname.trim(),
                phonenumber: phonenumber.trim(),
                homeaddress: homeaddress.trim(),
                notes: notes.trim(),
                numberofpanels: quote.numberofpanels,
                stories: quote.stories,
                city: quote.city,
                price: quote.price,
                basePrice: quote.basePrice,
                additionalPanelCost: quote.additionalPanelCost,
                travelSurcharge: quote.travelSurcharge,
                travelDistanceInMiles: quote.travelDistanceInMiles,
                travelDuration: quote.travelDuration,
                discountApplied: hasDiscount,
                discountAmount: hasDiscount ? activeOffer.discountAmount : null,
                discountedPrice: hasDiscount ? activeOffer.discountedPrice : null,
                discountType: hasDiscount ? activeOffer.type : null,
                discountReason: hasDiscount ? activeOffer.reason : null,
            })

            onLeadSaved(lead)
            showToast(
                outcomeStep === "won"
                    ? `Saved ${lead.fullname} as booked`
                    : `Saved ${lead.fullname} for follow-up`
            )
            resetAll()
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not save lead")
        } finally {
            setSaving(false)
        }
    }

    const renderOfferCard = (offer: QuoteCloseOffer, isActive: boolean) => (
        <div
            key={offer.type}
            className={`close-offer ${isActive ? "close-offer--active" : ""}`}
        >
            <div className="close-offer__header">
                <span className="close-offer__label">{offer.label}</span>
                {isActive && <span className="close-offer__badge">Active offer</span>}
            </div>
            <div className="close-offer__prices">
                <span className="close-offer__original">${offer.originalPrice}</span>
                <span className="close-offer__discounted">${offer.discountedPrice}</span>
                <span className="close-offer__savings">${offer.discountAmount} off</span>
            </div>
            <p className="close-offer__reason">{offer.reason}</p>
            <p className="close-offer__pitch">{offer.pitch}</p>
            <div className="close-offer__actions">
                {!isActive && (
                    <button
                        type="button"
                        className="btn btn-secondary btn-full"
                        onClick={() => setActiveOffer(offer)}
                    >
                        Use this price
                    </button>
                )}
                <button
                    type="button"
                    className="text-btn"
                    onClick={() => copyPitch(offer.pitch)}
                >
                    <IconCopy />
                    Copy pitch
                </button>
            </div>
        </div>
    )

    return (
        <div className="team-quote">
            <div className="team-quote__intro panel">
                <div>
                    <h2 className="panel__title">Phone quote calculator</h2>
                    <p className="team-quote__subtitle">
                        Quote the job, use close tools if they hesitate, then log won or lost —
                        all with the same pricing your website uses.
                    </p>
                </div>
                {quote && (
                    <button type="button" className="btn btn-secondary" onClick={resetAll}>
                        <IconRefresh />
                        New quote
                    </button>
                )}
            </div>

            <div className="team-quote__grid">
                <form className="panel team-quote__form" onSubmit={handleCalculate}>
                    <h3 className="team-quote__section-title">Job details</h3>

                    <label className="field">
                        <span className="field__label">Number of panels</span>
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            placeholder="e.g. 24"
                            value={panels}
                            onChange={(e) => setPanels(e.target.value)}
                            required
                        />
                    </label>

                    <label className="field">
                        <span className="field__label">City</span>
                        <input
                            type="text"
                            list="team-quote-cities"
                            placeholder="e.g. Temecula"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                        />
                        <datalist id="team-quote-cities">
                            {CITY_SUGGESTIONS.map((item) => (
                                <option key={item} value={item} />
                            ))}
                        </datalist>
                    </label>

                    <label className="field">
                        <span className="field__label">Number of stories</span>
                        <select
                            value={stories}
                            onChange={(e) =>
                                setStories(e.target.value as (typeof STORY_OPTIONS)[number])
                            }
                        >
                            {STORY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        disabled={loadingQuote}
                    >
                        {loadingQuote ? "Calculating..." : quote ? "Recalculate quote" : "Get quote"}
                    </button>
                </form>

                <div className="team-quote__result panel">
                    {!quote ? (
                        <div className="team-quote__empty">
                            <div className="team-quote__empty-icon">$</div>
                            <h3>Quote will appear here</h3>
                            <p>Enter panels, city, and stories to match the website price.</p>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`team-quote__price-block ${activeOffer ? "team-quote__price-block--discounted" : ""}`}
                            >
                                <span className="team-quote__price-label">
                                    {activeOffer ? "Closing price" : "Standard quote"}
                                </span>
                                <div className="team-quote__price-row">
                                    {activeOffer && (
                                        <span className="team-quote__price-original">
                                            ${quote.price}
                                        </span>
                                    )}
                                    <div className="team-quote__price">${closingPrice}</div>
                                </div>
                                {activeOffer && (
                                    <p className="team-quote__discount-note">
                                        {activeOffer.label} · ${activeOffer.discountAmount} off
                                    </p>
                                )}
                                <p className="team-quote__price-meta">
                                    {quote.numberofpanels} panels · {quote.stories} · {quote.city}
                                    {quote.travelDistanceInMiles > 0 && (
                                        <> · {quote.travelDistanceInMiles} mi from office</>
                                    )}
                                </p>
                                {activeOffer && (
                                    <button
                                        type="button"
                                        className="text-btn team-quote__reset-offer"
                                        onClick={() => setActiveOffer(null)}
                                    >
                                        Use standard price instead
                                    </button>
                                )}
                            </div>

                            <div className="team-quote__breakdown">
                                {quote.breakdown.map((line) => (
                                    <div key={line.label} className="team-quote__breakdown-row">
                                        <span>{line.label}</span>
                                        <span>${line.amount}</span>
                                    </div>
                                ))}
                                <div className="team-quote__breakdown-row team-quote__breakdown-row--total">
                                    <span>Standard total</span>
                                    <span>${quote.price}</span>
                                </div>
                            </div>

                            {!outcomeStep && (
                                <div className="close-tools" ref={closeToolsRef}>
                                    <div className="close-tools__header">
                                        <h3 className="team-quote__section-title">
                                            Close tools
                                        </h3>
                                        <p className="close-tools__hint">
                                            Customer hesitating? Generate a program or seasonal
                                            offer before you log the lead.
                                        </p>
                                    </div>

                                    <div className="close-tools__buttons">
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-lg close-tools__btn"
                                            onClick={handleSixMonthOffer}
                                        >
                                            6-month program price
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-lg close-tools__btn close-tools__btn--seasonal"
                                            onClick={handleSeasonalOffer}
                                            disabled={loadingSeasonal}
                                        >
                                            {loadingSeasonal
                                                ? "Generating..."
                                                : "Generate seasonal offer"}
                                        </button>
                                    </div>

                                    {(sixMonthOffer || seasonalOffer) && (
                                        <div className="close-tools__offers">
                                            {sixMonthOffer &&
                                                renderOfferCard(
                                                    sixMonthOffer,
                                                    activeOffer?.type === "six_month_program"
                                                )}
                                            {seasonalOffer &&
                                                renderOfferCard(
                                                    seasonalOffer,
                                                    activeOffer?.type === "seasonal"
                                                )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!outcomeStep ? (
                                <div className="team-quote__actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => startOutcome("won")}
                                    >
                                        Lead won
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-lg"
                                        onClick={() => startOutcome("lost")}
                                    >
                                        Lost lead
                                    </button>
                                </div>
                            ) : (
                                <div ref={outcomeRef} className="team-quote__outcome-wrap">
                                    <form
                                        className="team-quote__outcome"
                                        onSubmit={handleSaveOutcome}
                                    >
                                        <h3 className="team-quote__section-title">
                                            {outcomeStep === "won"
                                                ? "Save booked customer"
                                                : "Save for future follow-up"}
                                        </h3>
                                        {activeOffer && (
                                            <div className="team-quote__outcome-summary">
                                                Closing at{" "}
                                                <strong>${activeOffer.discountedPrice}</strong>{" "}
                                                ({activeOffer.reason})
                                            </div>
                                        )}

                                        <label className="field">
                                            <span className="field__label">Customer name</span>
                                            <input
                                                type="text"
                                                value={fullname}
                                                onChange={(e) => setFullname(e.target.value)}
                                                placeholder="John Smith"
                                                required
                                            />
                                        </label>

                                        {outcomeStep === "won" ? (
                                            <label className="field">
                                                <span className="field__label">Home address</span>
                                                <input
                                                    type="text"
                                                    value={homeaddress}
                                                    onChange={(e) =>
                                                        setHomeaddress(e.target.value)
                                                    }
                                                    placeholder="123 Main St, Temecula, CA"
                                                    required
                                                />
                                            </label>
                                        ) : null}

                                        <label className="field">
                                            <span className="field__label">
                                                Phone number
                                                {outcomeStep === "won" ? " (optional)" : ""}
                                            </span>
                                            <input
                                                type="tel"
                                                value={phonenumber}
                                                onChange={(e) => setPhonenumber(e.target.value)}
                                                placeholder="(951) 555-1234"
                                                required={outcomeStep === "lost"}
                                            />
                                        </label>

                                        <label className="field">
                                            <span className="field__label">Notes (optional)</span>
                                            <textarea
                                                rows={3}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Anything the team should remember..."
                                            />
                                        </label>

                                        <div className="team-quote__actions">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setOutcomeStep(null)}
                                                disabled={saving}
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-lg"
                                                disabled={saving}
                                            >
                                                {saving ? "Saving..." : "Save to dashboard"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
