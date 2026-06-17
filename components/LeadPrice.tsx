import type { Lead } from "@/lib/types"

interface LeadPriceProps {
    lead: Lead
    variant?: "card" | "hero"
}

function hasActiveDiscount(lead: Lead) {
    return (
        lead.discountApplied &&
        lead.discountedPrice != null &&
        lead.discountedPrice < lead.price
    )
}

export default function LeadPrice({ lead, variant = "card" }: LeadPriceProps) {
    if (!hasActiveDiscount(lead)) {
        return (
            <span className={`lead-price__single lead-price__single--${variant}`}>
                ${lead.price}
            </span>
        )
    }

    const savings = lead.discountAmount ?? lead.price - (lead.discountedPrice as number)

    return (
        <div className={`lead-price lead-price--${variant}`}>
            <span className="lead-price__original">${lead.price}</span>
            <span className="lead-price__discounted">${lead.discountedPrice}</span>
            {variant === "hero" && savings > 0 && (
                <span className="lead-price__badge">${savings} off</span>
            )}
        </div>
    )
}
