"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleRegister = async () => {
    setError("")

    if (!name || !email || !password) {
      setError("Please fill required fields")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error")
        return
      }

      router.push(`/verify?userId=${data.userId}`)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Account</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Loading..." : "Register"}
      </button>

      <p>
        Already have account? <Link href="/login">Login</Link>
      </p>
    </div>
  )
}