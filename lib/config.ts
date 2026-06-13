export const config = {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Leads Center",
    appSubtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "Dashboard",
    apiUrl:
        process.env.NEXT_PUBLIC_API_URL ||
        "https://us-central1-socal-solar-pro.cloudfunctions.net/leadsApi",
    storageKey: process.env.NEXT_PUBLIC_STORAGE_KEY || "leads_api_key",
}
