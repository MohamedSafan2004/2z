"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  getSizeRecommendation,
  isValidHeight,
  isValidWeight,
  type FitPreference,
  type SizeRecommendationResult,
} from "@/lib/sizeRecommendation"

const STORAGE_KEY = "2z_size_finder"
const SIZE_CHART_IMAGE = "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/size-chart.jpg"

function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}

type Tab = "CHART" | "FINDER"

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
  initialTab = "FINDER",
}: {
  open: boolean
  onClose: () => void
  initialTab?: Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [heightCm, setHeightCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [fitPreference, setFitPreference] = useState<FitPreference>("REGULAR")
  const [result, setResult] = useState<SizeRecommendationResult | null>(null)
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({})
  const [hasRestored, setHasRestored] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const heightInputRef = useRef<HTMLInputElement>(null)

  // ── Reset to requested tab + restore saved values each time it opens ────
  useEffect(() => {
    if (open && !hasRestored) {
      const stored = loadStoredState()
      queueMicrotask(() => {
        setTab(initialTab)
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
  }, [open, hasRestored, initialTab])

  // ── ESC to close, focus trap ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return

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

  // ── Focus the first field when the Finder tab becomes active ────────────
  useEffect(() => {
    if (open && tab === "FINDER") {
      queueMicrotask(() => heightInputRef.current?.focus())
    }
  }, [open, tab])

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
        background: "rgba(8,8,8,0.9)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "sf-backdrop-in 0.2s ease both",
      }}
    >
      <style>{`
        @keyframes sf-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sf-sheet-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sf-result-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sf-tab-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Shell ──────────────────────────────────────────────────────── */
        .sf-sheet {
          width: 100%;
          max-width: 560px;
          max-height: min(88vh, 720px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: #0a0a0a;
          border-radius: 16px 16px 0 0;
          animation: sf-sheet-in 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        @media (min-width: 640px) {
          .sf-sheet {
            border-radius: 16px;
            max-height: min(85vh, 680px);
          }
        }

        .sf-inner {
          padding: 24px 20px 20px;
        }
        @media (min-width: 480px) {
          .sf-inner { padding: 32px 32px 24px; }
        }
        @media (min-width: 640px) {
          .sf-inner { padding: 40px 40px 32px; }
        }

        /* ── Grabber (mobile sheet affordance) ─────────────────────────── */
        .sf-grabber {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: rgba(240,237,230,0.18);
          margin: 10px auto 0;
        }
        @media (min-width: 640px) {
          .sf-grabber { display: none; }
        }

        /* ── Header ─────────────────────────────────────────────────────── */
        .sf-close {
          background: none;
          border: none;
          color: rgba(240,237,230,0.4);
          cursor: pointer;
          width: 44px;
          height: 44px;
          margin: -10px -10px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
          flex-shrink: 0;
        }
        .sf-close:hover { color: #f0ede6; }
        .sf-close:active { color: rgba(240,237,230,0.7); }

        /* ── Tabs ───────────────────────────────────────────────────────── */
        .sf-tabs {
          display: flex;
          gap: 20px;
          border-bottom: 1px solid rgba(240,237,230,0.1);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .sf-tabs::-webkit-scrollbar { display: none; }
        .sf-tab {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 2px 16px;
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.38);
          position: relative;
          transition: color 0.15s ease;
          min-height: 44px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (min-width: 380px) {
          .sf-tabs { gap: 24px; }
          .sf-tab { font-size: 10.5px; letter-spacing: 0.1em; }
        }
        .sf-tab.active { color: #f0ede6; }
        .sf-tab::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 1px;
          background: #f0ede6;
          transform: scaleX(0);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sf-tab.active::after { transform: scaleX(1); }

        /* ── Eyebrow + heading ──────────────────────────────────────────── */
        .sf-eyebrow {
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.4);
          margin: 0 0 8px;
        }
        .sf-heading {
          font-family: "Cormorant Garamond", serif;
          font-weight: 300;
          font-size: 28px;
          line-height: 1.1;
          color: #f0ede6;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        @media (min-width: 480px) {
          .sf-heading { font-size: 32px; }
        }
        .sf-subtitle {
          font-family: "Cormorant Garamond", serif;
          font-size: 15px;
          line-height: 1.55;
          color: rgba(240,237,230,0.48);
          margin: 0 0 24px;
          max-width: 420px;
        }

        /* ── Inputs ─────────────────────────────────────────────────────── */
        .sf-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .sf-field-label {
          display: block;
          font-family: "Space Mono", monospace;
          font-size: 9.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.42);
          margin-bottom: 8px;
        }
        .sf-input {
          width: 100%;
          background: rgba(240,237,230,0.03);
          border: none;
          border-bottom: 1px solid rgba(240,237,230,0.16);
          color: #f0ede6;
          font-family: "Cormorant Garamond", serif;
          font-weight: 400;
          font-size: 24px;
          padding: 10px 10px;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          -moz-appearance: textfield;
          appearance: textfield;
          border-radius: 4px 4px 0 0;
          min-height: 44px;
        }
        .sf-input::-webkit-outer-spin-button,
        .sf-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .sf-input::placeholder {
          color: rgba(240,237,230,0.16);
        }
        .sf-input:focus {
          border-bottom-color: #f0ede6;
          background: rgba(240,237,230,0.05);
        }
        .sf-input.has-error {
          border-bottom-color: rgba(190,110,95,0.7);
        }
        .sf-error {
          font-family: "Space Mono", monospace;
          font-size: 9px;
          color: rgba(190,120,105,0.9);
          margin-top: 6px;
        }

        /* ── Fit selector (segmented control) ──────────────────────────── */
        .sf-fit-block { margin-bottom: 28px; }
        .sf-segmented {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(240,237,230,0.04);
          border: 1px solid rgba(240,237,230,0.1);
          border-radius: 8px;
          padding: 3px;
        }
        .sf-segmented-thumb {
          position: absolute;
          top: 3px; bottom: 3px;
          left: 3px;
          width: calc(50% - 3px);
          background: #f0ede6;
          border-radius: 6px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sf-segmented-option {
          position: relative;
          z-index: 1;
          background: none;
          border: none;
          cursor: pointer;
          min-height: 44px;
          padding: 0 8px;
          font-family: "Space Mono", monospace;
          font-size: 10.5px;
          letter-spacing: 0.05em;
          color: rgba(240,237,230,0.55);
          transition: color 0.2s ease;
          border-radius: 6px;
        }
        .sf-segmented-option.active { color: #080808; }
        .sf-segmented-option:not(.active):hover { color: rgba(240,237,230,0.85); }

        /* ── Primary CTA ────────────────────────────────────────────────── */
        .sf-submit {
          width: 100%;
          background: #f0ede6;
          border: none;
          border-radius: 8px;
          color: #080808;
          font-family: "Space Mono", monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          min-height: 48px;
          padding: 0 20px;
          cursor: pointer;
          transition: background-color 0.15s ease, transform 0.1s ease;
        }
        .sf-submit:hover { background: #ffffff; }
        .sf-submit:active { transform: scale(0.98); background: rgba(240,237,230,0.85); }
        .sf-submit:disabled {
          background: rgba(240,237,230,0.12);
          color: rgba(240,237,230,0.3);
          cursor: not-allowed;
        }

        /* ── Result ─────────────────────────────────────────────────────── */
        .sf-result {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(240,237,230,0.1);
          animation: sf-result-in 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .sf-result-label {
          font-family: "Space Mono", monospace;
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.42);
          margin: 0 0 8px;
        }
        .sf-result-size {
          font-family: "Cormorant Garamond", serif;
          font-weight: 300;
          font-size: 56px;
          line-height: 1;
          color: #f0ede6;
          margin: 0 0 12px;
        }
        .sf-result-reason {
          font-family: "Cormorant Garamond", serif;
          font-size: 16px;
          line-height: 1.55;
          color: rgba(240,237,230,0.62);
          margin: 0 0 16px;
          max-width: 400px;
        }
        .sf-confidence {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 16px;
        }
        .sf-confidence-label {
          font-family: "Space Mono", monospace;
          font-size: 9.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.38);
        }
        .sf-confidence-value {
          font-family: "Space Mono", monospace;
          font-size: 10.5px;
          letter-spacing: 0.06em;
          color: rgba(240,237,230,0.7);
        }
        .sf-retry {
          background: none;
          border: none;
          color: rgba(240,237,230,0.42);
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          cursor: pointer;
          padding: 8px 0;
          min-height: 44px;
          transition: color 0.15s ease;
        }
        .sf-retry:hover { color: #f0ede6; }

        /* ── Size chart tab ─────────────────────────────────────────────── */
        .sf-chart-panel {
          animation: sf-tab-in 0.2s ease both;
        }
        .sf-chart-img {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 8px;
        }
      `}</style>

      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-finder-title"
        className="sf-sheet"
      >
        <div className="sf-grabber" />

        <div className="sf-inner">
          {/* Header: eyebrow/heading + close */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <p className="sf-eyebrow">Find My Size</p>
              <h2 id="size-finder-title" className="sf-heading">
                {tab === "FINDER" ? "Size Recommendation" : "Size Chart"}
              </h2>
            </div>
            <button className="sf-close" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="sf-tabs" role="tablist" aria-label="Size guide">
            <button
              role="tab"
              aria-selected={tab === "FINDER"}
              className={`sf-tab ${tab === "FINDER" ? "active" : ""}`}
              onClick={() => setTab("FINDER")}
            >
              Size Recommendation
            </button>
            <button
              role="tab"
              aria-selected={tab === "CHART"}
              className={`sf-tab ${tab === "CHART" ? "active" : ""}`}
              onClick={() => setTab("CHART")}
            >
              Size Chart
            </button>
          </div>

          {tab === "CHART" ? (
            <div className="sf-chart-panel">
              <img src={optimizeCloudinaryUrl(SIZE_CHART_IMAGE, 700)} alt="Size Chart" className="sf-chart-img" />
            </div>
          ) : (
            <div className="sf-tab-in">
              <p className="sf-subtitle">
                Our tees are oversized by design. Enter your height and weight for a size that fits the way it&apos;s meant to.
              </p>

              {/* Inputs */}
              <div className="sf-inputs-grid">
                <div>
                  <label htmlFor="sf-height" className="sf-field-label">Height (cm)</label>
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
                  {errors.height && <p id="sf-height-error" className="sf-error">{errors.height}</p>}
                </div>

                <div>
                  <label htmlFor="sf-weight" className="sf-field-label">Weight (kg)</label>
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
                  {errors.weight && <p id="sf-weight-error" className="sf-error">{errors.weight}</p>}
                </div>
              </div>

              {/* Fit selector */}
              <div className="sf-fit-block">
                <p className="sf-field-label">Preferred Fit</p>
                <div className="sf-segmented" role="radiogroup" aria-label="Preferred fit">
                  <div
                    className="sf-segmented-thumb"
                    style={{ transform: fitPreference === "OVERSIZED" ? "translateX(100%)" : "translateX(0%)" }}
                  />
                  <button
                    type="button"
                    role="radio"
                    aria-checked={fitPreference === "REGULAR"}
                    className={`sf-segmented-option ${fitPreference === "REGULAR" ? "active" : ""}`}
                    onClick={() => setFitPreference("REGULAR")}
                  >
                    Regular Fit
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={fitPreference === "OVERSIZED"}
                    className={`sf-segmented-option ${fitPreference === "OVERSIZED" ? "active" : ""}`}
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
                <div key={result.size} className="sf-result">
                  <p className="sf-result-label">Recommended Size</p>
                  <p className="sf-result-size">{result.size}</p>
                  <p className="sf-result-reason">
                    {result.reason}
                    {result.alternative ? ` ${result.alternative.message}` : ""}
                  </p>
                  <div className="sf-confidence">
                    <span className="sf-confidence-label">Confidence</span>
                    <span className="sf-confidence-value">
                      {result.confidence === "HIGH" ? "High" : result.confidence === "MEDIUM" ? "Medium" : "Low"}
                    </span>
                  </div>
                  <button className="sf-retry" onClick={handleReset}>
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
