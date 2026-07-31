// lib/sizeRecommendation.ts
//
// Deterministic "Find My Size" algorithm for 2Z oversized tees.
// No third-party APIs, no AI — pure local scoring, runs entirely client-side.
//
// Approach: each size owns a realistic Height/Weight RANGE (not a single
// point). We score how well the user's body profile fits inside each
// size's range on four independent axes — height, weight, BMI, and fit
// preference — using a "peak" curve that scores highest at the range's
// center and decays smoothly toward and past its edges. The size with
// the highest combined score wins. This replaces brittle if/else cliffs
// with something that behaves sensibly for every input, including values
// that sit exactly on a boundary between two sizes.

export type FitPreference = "REGULAR" | "OVERSIZED"
export type SizeKey = "M" | "L" | "XL"
export type Confidence = "HIGH" | "MEDIUM" | "LOW"

export interface SizeRecommendationInput {
  heightCm: number
  weightKg: number
  fitPreference: FitPreference
}

export interface SizeRecommendationResult {
  size: SizeKey
  confidence: Confidence
  reason: string
  alternative: {
    size: SizeKey
    message: string
  } | null
  /** 0–100 per size — handy if the UI ever wants comparison bars. */
  scores: Record<SizeKey, number>
}

// ── Reference data ────────────────────────────────────────────────────────

// Garment measurements (cm), for reference / future copy use.
export const GARMENT_CHART: Record<SizeKey, { width: number; length: number }> = {
  M: { width: 55, length: 67 },
  L: { width: 59, length: 69 },
  XL: { width: 61, length: 70 },
}

// Real-world body ranges each size is designed to flatter, given the
// garment is oversized. Ranges intentionally overlap — the scoring
// function below is what resolves that overlap.
export const SIZE_RANGES: Record<SizeKey, { height: [number, number]; weight: [number, number] }> = {
  M: { height: [160, 172], weight: [50, 68] },
  L: { height: [170, 182], weight: [65, 82] },
  XL: { height: [178, 192], weight: [78, 100] },
}

// Ideal BMI band per size. Oversized garments forgive a wider band than
// fitted clothing would, so these are deliberately generous.
export const BMI_RANGES: Record<SizeKey, [number, number]> = {
  M: [17, 23],
  L: [21, 27],
  XL: [24, 31],
}

const SIZE_ORDER: SizeKey[] = ["M", "L", "XL"]

// Weight given to each scoring axis. Weight matters most because build
// is the strongest signal for how an oversized silhouette will sit;
// height adds proportion; BMI adds a build signal independent of raw
// numbers; fit preference is a deliberate, gentle nudge — not a filter.
const AXIS_WEIGHTS = {
  height: 0.3,
  weight: 0.35,
  bmi: 0.25,
  fit: 0.1,
}

// How many units (cm / kg / BMI points) of "falloff" beyond a range's
// edge before that axis's score bottoms out at 0. Smooth decay instead
// of a hard cutoff — being just outside a range still scores reasonably.
const HEIGHT_FALLOFF_CM = 10
const WEIGHT_FALLOFF_KG = 12
const BMI_FALLOFF = 4

// Scores within `epsilon` of the top score are treated as a genuine tie.
const TIE_EPSILON = 0.012

// "Ceiling case": how close (in cm / kg) to a range's upper edge counts
// as maxing that size out on that axis.
const CEILING_PROXIMITY_CM = 1
const CEILING_PROXIMITY_KG = 1

// Alternative-size suggestion: only surface a second size if it scored
// within this margin of the winner.
const ALTERNATIVE_MARGIN = 0.1

// ── Scoring primitives ─────────────────────────────────────────────────────

/**
 * Scores how well `value` fits inside [min, max].
 * 1.0 at the range's center, decaying to 0.75 at either edge, then
 * continuing to decay linearly to 0 over the next `falloff` units
 * beyond the edge. This is what makes the curve smooth instead of a
 * hard cutoff, and lets edge-of-range values still register as a
 * plausible (if imperfect) fit for the neighboring size.
 */
function peakScore(value: number, min: number, max: number, falloff: number): number {
  const mid = (min + max) / 2
  const halfWidth = (max - min) / 2
  const distanceFromMid = Math.abs(value - mid)

  if (distanceFromMid <= halfWidth) {
    return 1 - 0.25 * (distanceFromMid / halfWidth)
  }

  const distanceBeyondEdge = distanceFromMid - halfWidth
  const edgeScore = 0.75
  return Math.max(0, edgeScore * (1 - distanceBeyondEdge / falloff))
}

function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

/**
 * Fit preference nudges the score toward the larger or smaller end of
 * the size range rather than acting as a hard filter — REGULAR slightly
 * favors smaller sizes, OVERSIZED slightly favors larger ones.
 */
function fitPreferenceScore(size: SizeKey, fitPreference: FitPreference): number {
  const index = SIZE_ORDER.indexOf(size)
  const maxIndex = SIZE_ORDER.length - 1
  const normalizedPosition = index / maxIndex // 0 = smallest, 1 = largest

  return fitPreference === "OVERSIZED" ? normalizedPosition : 1 - normalizedPosition
}

// ── Core scoring ───────────────────────────────────────────────────────────

function scoreSize(size: SizeKey, input: SizeRecommendationInput): number {
  const range = SIZE_RANGES[size]
  const bmiRange = BMI_RANGES[size]
  const bmi = calculateBMI(input.heightCm, input.weightKg)

  const heightScore = peakScore(input.heightCm, range.height[0], range.height[1], HEIGHT_FALLOFF_CM)
  const weightScore = peakScore(input.weightKg, range.weight[0], range.weight[1], WEIGHT_FALLOFF_KG)
  const bmiScore = peakScore(bmi, bmiRange[0], bmiRange[1], BMI_FALLOFF)
  const fitScore = fitPreferenceScore(size, input.fitPreference)

  return (
    heightScore * AXIS_WEIGHTS.height +
    weightScore * AXIS_WEIGHTS.weight +
    bmiScore * AXIS_WEIGHTS.bmi +
    fitScore * AXIS_WEIGHTS.fit
  )
}

function scoreAllSizes(input: SizeRecommendationInput): Record<SizeKey, number> {
  return {
    M: scoreSize("M", input),
    L: scoreSize("L", input),
    XL: scoreSize("XL", input),
  }
}

/**
 * A "ceiling case": the user's height AND weight are both at or beyond
 * this size's upper edge on both axes at once — i.e. they've maxed the
 * size out in every dimension, not just one. For an oversized brand,
 * maxing out a size this way is the signal to size up, independent of
 * stated fit preference.
 */
function isCeilingCase(size: SizeKey, input: SizeRecommendationInput): boolean {
  const range = SIZE_RANGES[size]
  const atHeightCeiling = input.heightCm >= range.height[1] - CEILING_PROXIMITY_CM
  const atWeightCeiling = input.weightKg >= range.weight[1] - CEILING_PROXIMITY_KG
  return atHeightCeiling && atWeightCeiling
}

function pickBestSize(scores: Record<SizeKey, number>, input: SizeRecommendationInput): SizeKey {
  const entries = SIZE_ORDER.map((size) => ({ size, score: scores[size] }))
  const maxScore = Math.max(...entries.map((e) => e.score))
  const tied = entries.filter((e) => maxScore - e.score <= TIE_EPSILON)

  if (tied.length > 1) {
    const sorted = tied.slice().sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
    const smaller = sorted[0]
    const larger = sorted[sorted.length - 1]

    // Maxed-out-on-every-axis beats stated preference: round up.
    if (isCeilingCase(smaller.size, input)) return larger.size

    return input.fitPreference === "REGULAR" ? smaller.size : larger.size
  }

  return entries.reduce((best, e) => (e.score > best.score ? e : best)).size
}

function confidenceFromScore(topScore: number, runnerUpScore: number): Confidence {
  const margin = topScore - runnerUpScore
  if (topScore >= 0.82 && margin >= 0.12) return "HIGH"
  if (topScore >= 0.6) return "MEDIUM"
  return "LOW"
}

function buildReason(size: SizeKey, fitPreference: FitPreference): string {
  const fitWord = fitPreference === "OVERSIZED" ? "relaxed, more oversized" : "intended oversized"
  return `Based on your height and weight, ${size} will give you the ${fitWord} silhouette.`
}

/**
 * Builds the "you may also consider" nudge shown under the result.
 * Only surfaces an alternative when it scored close enough to be a
 * genuine second option — otherwise stays null and the UI shows nothing.
 */
function buildAlternative(
  recommended: SizeKey,
  scores: Record<SizeKey, number>,
): SizeRecommendationResult["alternative"] {
  const recIndex = SIZE_ORDER.indexOf(recommended)

  const candidates = SIZE_ORDER.map((size, index) => ({ size, index, score: scores[size] }))
    .filter((c) => c.size !== recommended)
    .filter((c) => scores[recommended] - c.score <= ALTERNATIVE_MARGIN)
    .sort((a, b) => b.score - a.score)

  if (candidates.length === 0) return null

  const alt = candidates[0]
  const isLarger = alt.index > recIndex

  const message = isLarger
    ? `If you prefer a more relaxed look, you may also consider ${alt.size}.`
    : `If you prefer a more fitted look, you may also consider ${alt.size}.`

  return { size: alt.size, message }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getSizeRecommendation(input: SizeRecommendationInput): SizeRecommendationResult {
  const scores = scoreAllSizes(input)
  const size = pickBestSize(scores, input)

  const sortedScores = SIZE_ORDER.map((s) => scores[s]).sort((a, b) => b - a)
  const [topScore, runnerUpScore] = sortedScores

  const confidence = confidenceFromScore(topScore, runnerUpScore ?? 0)
  const reason = buildReason(size, input.fitPreference)
  const alternative = buildAlternative(size, scores)

  const scoresOut = SIZE_ORDER.reduce((acc, s) => {
    acc[s] = Math.round(scores[s] * 100)
    return acc
  }, {} as Record<SizeKey, number>)

  return { size, confidence, reason, alternative, scores: scoresOut }
}

export function isValidHeight(heightCm: number): boolean {
  return Number.isFinite(heightCm) && heightCm >= 130 && heightCm <= 220
}

export function isValidWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg >= 30 && weightKg <= 200
}