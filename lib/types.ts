export type LeadStatus =
    | "new"
    | "contacted"
    | "customer_scheduled"
    | "scheduled"
    | "completed"
    | "lost"

const LEGACY_STATUS_MAP: Record<string, LeadStatus> = {
    follow_up: "contacted",
    qualified: "contacted",
    won: "completed",
}

export const STATUS_CONFIG: Record<
    LeadStatus,
    { label: string; color: string; bg: string }
> = {
    new: { label: "New", color: "#068DD4", bg: "#E8F6FC" },
    contacted: { label: "Contacted", color: "#7C3AED", bg: "#F3E8FF" },
    customer_scheduled: { label: "Customer Scheduled", color: "#0D9488", bg: "#CCFBF1" },
    scheduled: { label: "Scheduled", color: "#2563EB", bg: "#DBEAFE" },
    completed: { label: "Completed", color: "#16A34A", bg: "#DCFCE7" },
    lost: { label: "Lost", color: "#6B7280", bg: "#F3F4F6" },
}

export const PIPELINE_STATUSES: LeadStatus[] = [
    "new",
    "contacted",
    "customer_scheduled",
    "scheduled",
    "completed",
    "lost",
]

export function normalizeStatus(status?: string | null): LeadStatus {
    if (!status) return "new"
    if (status in STATUS_CONFIG) return status as LeadStatus
    return LEGACY_STATUS_MAP[status] || "new"
}

export interface Lead {
    id: string
    fullname: string
    phonenumber: string
    email: string
    homeaddress: string
    city: string
    zipcode: string
    numberofpanels: number
    stories: string
    price: number
    discountApplied?: boolean
    discountAmount?: number | null
    discountedPrice?: number | null
    travelDistanceInMiles?: number
    travelDuration?: string
    status: LeadStatus
    priority: string
    source: string
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
    notes: string
    assignedTo?: string | null
    lastContactedAt?: string | null
    generatedMessage?: string | null
    messageGeneratedAt?: string | null
    messageStatus?: string | null
    scheduledDate?: string | null
    scheduledAt?: string | null
    calendarEventId?: string | null
    createdAt?: string | null
    updatedAt?: string | null
}

export interface LeadStats {
    total: number
    byStatus: Record<string, number>
    bySource: Record<string, number>
    sourceSummary?: Array<{ id: string; label: string; count: number }>
    today: number
    thisWeek: number
}

export interface QuoteBreakdownLine {
    label: string
    amount: number
}

export interface QuoteResult {
    price: number
    basePrice: number
    additionalPanelCost: number
    travelSurcharge: number
    travelDistanceInMiles: number
    travelDuration: string
    numberofpanels: number
    stories: string
    city: string
    breakdown: QuoteBreakdownLine[]
    officeAddress: string
}

export type PhoneQuoteOutcome = "won" | "lost"
