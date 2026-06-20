"use client"

import { useState } from "react"
import { calculateQuote, savePhoneQuote } from "@/lib/api"
import type { Lead, PhoneQuoteOutcome, QuoteResult } from "@/lib/types"
import { IconRefresh } from "./icons"

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
    const [outcomeStep, setOutcomeStep] = useState<OutcomeStep>(null)
    const [loadingQuote, setLoadingQuote] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fullname, setFullname] = useState("")
    const [phonenumber, setPhonenumber] = useState("")
    const [homeaddress, setHomeaddress] = useState("")
    const [notes, setNotes] = useState("")

    const resetAll = () => {
        setPanels("")
        setCity("")
        setStories("Single Story")
        setQuote(null)
        setOutcomeStep(null)
        setFullname("")
        setPhonenumber("")
        setHomeaddress("")
        setNotes("")
    }

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

    const handleSaveOutcome = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!quote || !outcomeStep) return

        setSaving(true)
        try {
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

    return (
        <div className="team-quote">
            <div className="team-quote__intro panel">
                <div>
                    <h2 className="panel__title">Phone quote calculator</h2>
                    <p className="team-quote__subtitle">
                        Same pricing as the website — panels, city, and stories. Use this while
                        you&apos;re on a call, then log won or lost leads to your dashboard.
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
                            <div className="team-quote__price-block">
                                <span className="team-quote__price-label">Quote price</span>
                                <div className="team-quote__price">${quote.price}</div>
                                <p className="team-quote__price-meta">
                                    {quote.numberofpanels} panels · {quote.stories} · {quote.city}
                                    {quote.travelDistanceInMiles > 0 && (
                                        <> · {quote.travelDistanceInMiles} mi from office</>
                                    )}
                                </p>
                            </div>

                            <div className="team-quote__breakdown">
                                {quote.breakdown.map((line) => (
                                    <div key={line.label} className="team-quote__breakdown-row">
                                        <span>{line.label}</span>
                                        <span>${line.amount}</span>
                                    </div>
                                ))}
                                <div className="team-quote__breakdown-row team-quote__breakdown-row--total">
                                    <span>Total</span>
                                    <span>${quote.price}</span>
                                </div>
                            </div>

                            {!outcomeStep ? (
                                <div className="team-quote__actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setOutcomeStep("won")}
                                    >
                                        Lead won
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-lg"
                                        onClick={() => setOutcomeStep("lost")}
                                    >
                                        Lost lead
                                    </button>
                                </div>
                            ) : (
                                <form className="team-quote__outcome" onSubmit={handleSaveOutcome}>
                                    <h3 className="team-quote__section-title">
                                        {outcomeStep === "won"
                                            ? "Save booked customer"
                                            : "Save for future follow-up"}
                                    </h3>

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
                                                onChange={(e) => setHomeaddress(e.target.value)}
                                                placeholder="123 Main St, Temecula, CA"
                                                required
                                            />
                                        </label>
                                    ) : null}

                                    <label className="field">
                                        <span className="field__label">
                                            Phone number{outcomeStep === "won" ? " (optional)" : ""}
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
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
