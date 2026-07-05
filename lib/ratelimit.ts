import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 requests كل دقيقة لكل IP
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "login",
})

// 30 requests كل دقيقة للـ API العام
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "api",
})

// 5 orders كل 10 دقايق لكل IP
export const orderRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "order",
})

// 10 requests كل 10 دقايق لكل IP — للـ endpoints الحساسة اللي مش محمية بـ auth
// (submit-instapay-ref, promo/validate, validate-cart)
export const sensitiveRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: "sensitive",
})

// 5 محاولات كل 15 دقيقة لكل EMAIL — طبقة تانية بجانب الـ IP limit
// بتوقف brute-force على حساب معين حتى لو الهجوم جاي من IPs مختلفة
export const emailLoginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "login-email",
})