"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  getSizeRecommendation,
  isValidHeight,
  isValidWeight,
  type FitPreference,
  type SizeRecommendationResult,
} from "@/lib/sizeRecommendation"

const ACCENT = "#c8f04f"
const STORAGE_KEY = "2z_size_finder"

interface StoredState {
  heightCm: string
  weightKg: string
  fitPreference: FitPreference
  result: SizeRecommendationResult | null
}

function loadStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredState
  } catch {
    return null
  }
}

function saveStoredState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private browsing, quota) — fail silently,
    // the feature still works for this session.
  }
}

export default function SizeRecommendationModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [heightCm, setHeightCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [fitPreference, setFitPreference] = useState<FitPreference>("REGULAR")
  const [result, setResult] = useState<SizeRecommendationResult | null>(null)
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({})
  const [hasRestored, setHasRestored] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const heightInputRef = useRef<HTMLInputElement>(null)

  // ── Restore previous values on first open ──────────────────────────────
  useEffect(() => {
    if (open && !hasRestored) {
      const stored = loadStoredState()
      queueMicrotask(() => {
        if (stored) {
          setHeightCm(stored.heightCm ?? "")
          setWeightKg(stored.weightKg ?? "")
          setFitPreference(stored.fitPreference ?? "REGULAR")
          setResult(stored.result ?? null)
        }
        setHasRestored(true)
      })
    } else if (!open && hasRestored) {
      queueMicrotask(() => setHasRestored(false))
    }
  }, [open, hasRestored])

  // ── Focus on open, ESC to close, focus trap ─────────────────────────────
  useEffect(() => {
    if (!open) return

    queueMicrotask(() => heightInputRef.current?.focus())

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key !== "Tab") return

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const validate = useCallback((h: number, w: number) => {
    const nextErrors: { height?: string; weight?: string } = {}
    if (!isValidHeight(h)) nextErrors.height = "Enter a height between 130–220 cm"
    if (!isValidWeight(w)) nextErrors.weight = "Enter a weight between 30–200 kg"
    return nextErrors
  }, [])

  const handleFindSize = () => {
    const h = parseFloat(heightCm)
    const w = parseFloat(weightKg)
    const validationErrors = validate(h, w)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const recommendation = getSizeRecommendation({ heightCm: h, weightKg: w, fitPreference })
    setResult(recommendation)
    saveStoredState({ heightCm, weightKg, fitPreference, result: recommendation })
  }

  const handleReset = () => setResult(null)

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,8,8,0.88)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "sizeModalFadeIn 0.25s ease both",
      }}
    >
      <style>{`
        @keyframes sizeModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sf-modal {
          padding: 56px 48px;
        }
        @media (max-width: 480px) {
          .sf-modal {
            padding: 32px 22px;
          }
          .sf-inputs-grid {
            grid-template-columns: 1fr !important;
            gap: 22px !important;
          }
          .sf-header-block { margin-bottom: 26px !important; }
          .sf-subtitle { margin-bottom: 28px !important; font-size: 15px !important; }
          .sf-inputs-wrap { margin-bottom: 26px !important; }
          .sf-fit-block { margin-bottom: 28px !important; }
          .sf-heading { font-size: 30px !important; }
          .sf-result-wrap { margin-top: 30px !important; }
          .sf-result-size { font-size: 60px !important; margin-bottom: 12px !important; }
        }
        @keyframes sizeModalRise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sizeResultReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sf-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(240,237,230,0.16);
          color: #f0ede6;
          font-family: "Cormorant Garamond", serif;
          font-weight: 300;
          font-size: 30px;
          padding: 0 0 10px;
          outline: none;
          transition: border-color 0.2s ease;
          -moz-appearance: textfield;
          appearance: textfield;
        }
        .sf-input::-webkit-outer-spin-button,
        .sf-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .sf-input::placeholder {
          color: rgba(240,237,230,0.18);
        }
        .sf-input:focus {
          border-bottom-color: rgba(240,237,230,0.55);
        }
        .sf-input.has-error {
          border-bottom-color: rgba(200,110,90,0.6);
        }

        .sf-fit-track {
          position: relative;
          display: flex;
          border-bottom: 1px solid rgba(240,237,230,0.16);
        }
        .sf-fit-option {
          flex: 1;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 14px;
          font-family: "Space Mono", monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: rgba(240,237,230,0.4);
          transition: color 0.25s ease;
        }
        .sf-fit-option.active {
          color: #f0ede6;
        }
        .sf-fit-indicator {
          position: absolute;
          bottom: -1px;
          height: 1px;
          width: 50%;
          background: #f0ede6;
          transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .sf-submit {
          width: 100%;
          background: none;
          border: none;
          border-top: 1px solid rgba(240,237,230,0.2);
          color: #f0ede6;
          font-family: "Space Mono", monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 20px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: opacity 0.2s ease;
        }
        .sf-submit:hover { opacity: 0.6; }

        .sf-close {
          background: none;
          border: none;
          color: rgba(240,237,230,0.35);
          cursor: pointer;
          padding: 4px;
          line-height: 0;
          transition: color 0.2s ease;
        }
        .sf-close:hover { color: #f0ede6; }

        .sf-retry {
          background: none;
          border: none;
          color: rgba(240,237,230,0.4);
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }
        .sf-retry:hover { color: #f0ede6; }
      `}</style>

      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-finder-title"
        className="sf-modal"
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: "#0a0a0a",
          borderRadius: "2px",
          animation: "sizeModalRise 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Header */}
        <div className="sf-header-block" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <p style={{ fontFamily: "Space Mono, monospace", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", margin: "0 0 14px" }}>
              Find My Size
            </p>
            <h2
              id="size-finder-title"
              className="sf-heading"
              style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 300, fontSize: "40px", lineHeight: 1.05, color: "#f0ede6", margin: 0, letterSpacing: "-0.01em" }}
            >
              Size Recommendation
            </h2>
          </div>
          <button className="sf-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="sf-subtitle" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "17px", lineHeight: 1.6, color: "rgba(240,237,230,0.5)", margin: "0 0 44px", maxWidth: "420px" }}>
          Our tees are oversized by design. Enter your height and weight for a size that fits the way it&apos;s meant to.
        </p>

        {/* Inputs */}
        <div className="sf-inputs-grid sf-inputs-wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "36px" }}>
          <div>
            <label htmlFor="sf-height" style={{ display: "block", fontFamily: "Space Mono, monospace", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "12px" }}>
              Height (cm)
            </label>
            <input
              ref={heightInputRef}
              id="sf-height"
              type="number"
              inputMode="numeric"
              placeholder="175"
              className={`sf-input ${errors.height ? "has-error" : ""}`}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              aria-invalid={!!errors.height}
              aria-describedby={errors.height ? "sf-height-error" : undefined}
            />
            {errors.height && (
              <p id="sf-height-error" style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", color: "rgba(200,120,100,0.85)", marginTop: "8px" }}>
                {errors.height}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sf-weight" style={{ display: "block", fontFamily: "Space Mono, monospace", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "12px" }}>
              Weight (kg)
            </label>
            <input
              id="sf-weight"
              type="number"
              inputMode="numeric"
              placeholder="72"
              className={`sf-input ${errors.weight ? "has-error" : ""}`}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              aria-invalid={!!errors.weight}
              aria-describedby={errors.weight ? "sf-weight-error" : undefined}
            />
            {errors.weight && (
              <p id="sf-weight-error" style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", color: "rgba(200,120,100,0.85)", marginTop: "8px" }}>
                {errors.weight}
              </p>
            )}
          </div>
        </div>

        {/* Fit selector */}
        <div className="sf-fit-block" style={{ marginBottom: "44px" }}>
          <p style={{ fontFamily: "Space Mono, monospace", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "14px" }}>
            Preferred Fit
          </p>
          <div className="sf-fit-track" role="radiogroup" aria-label="Preferred fit">
            <div
              className="sf-fit-indicator"
              style={{ transform: fitPreference === "OVERSIZED" ? "translateX(100%)" : "translateX(0%)" }}
            />
            <button
              type="button"
              role="radio"
              aria-checked={fitPreference === "REGULAR"}
              className={`sf-fit-option ${fitPreference === "REGULAR" ? "active" : ""}`}
              onClick={() => setFitPreference("REGULAR")}
            >
              Regular Fit
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={fitPreference === "OVERSIZED"}
              className={`sf-fit-option ${fitPreference === "OVERSIZED" ? "active" : ""}`}
              onClick={() => setFitPreference("OVERSIZED")}
            >
              Relaxed / Oversized
            </button>
          </div>
        </div>

        <button className="sf-submit" onClick={handleFindSize}>
          Find My Size
        </button>

        {/* Result */}
        {result && (
          <div
            key={result.size}
            className="sf-result-wrap"
            style={{ marginTop: "48px", animation: "sizeResultReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <p style={{ fontFamily: "Space Mono, monospace", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", margin: "0 0 4px" }}>
              Recommended Size
            </p>

            <p className="sf-result-size" style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 300, fontSize: "88px", lineHeight: 1, color: ACCENT, margin: "0 0 20px" }}>
              {result.size}
            </p>

            {result.alternative && (
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", lineHeight: 1.5, color: "rgba(240,237,230,0.45)", margin: "0 0 26px" }}>
                {result.alternative.message}
              </p>
            )}

            <button className="sf-retry" onClick={handleReset} style={{ marginTop: result.alternative ? 0 : "26px" }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
