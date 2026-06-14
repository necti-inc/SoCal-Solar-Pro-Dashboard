"use client"

import { useState } from "react"
import { login, verifyApiKey } from "@/lib/api"
import { config } from "@/lib/config"
import { IconSun } from "./icons"

interface LoginProps {
    onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) return

        setLoading(true)
        setError("")

        try {
            const valid = await verifyApiKey(password.trim())
            if (!valid) throw new Error()
            login(password.trim())
            onLogin()
        } catch {
            setError("Incorrect password. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-brand">
                <div className="auth-brand__icon">
                    <IconSun />
                </div>
                <h1>{config.appName}</h1>
                <p>Lead management built for solar service teams. Track inquiries, update pipeline status, and send outreach — all from one place.</p>
                <ul className="auth-features">
                    <li>Real-time lead pipeline</li>
                    <li>One-tap call & text</li>
                    <li>AI-generated outreach</li>
                </ul>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__header">
                    <h2>Welcome back</h2>
                    <p>Sign in to {config.appSubtitle}</p>
                </div>

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter team password"
                    autoComplete="current-password"
                    autoFocus
                />

                {error && <p className="auth-error">{error}</p>}

                <button
                    type="submit"
                    className="btn btn-primary btn-full btn-lg"
                    disabled={loading || !password.trim()}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </div>
    )
}
