import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendToWebhook } from "@/lib/webhook";

const PHONE_REGEX = /^01[0125][0-9]{8}$/;

type CartItem = { name: string; color: string; size: string; quantity: number };

function sanitizeItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 20).map((item) => {
    const i = (item ?? {}) as Record<string, unknown>;
    return {
      name: typeof i.name === "string" ? i.name.slice(0, 100) : "",
      color: typeof i.color === "string" ? i.color.slice(0, 2) : "",
      size: typeof i.size === "string" ? i.size.slice(0, 10) : "",
      quantity:
        typeof i.quantity === "number" && i.quantity > 0 && i.quantity <= 99
          ? Math.floor(i.quantity)
          : 1,
    };
  });
}
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  const phone =
    typeof raw.phone === "string" ? raw.phone.replace(/\s+/g, "") : "";
  const name =
    typeof raw.name === "string" ? raw.name.trim().slice(0, 100) || null : null;
  const items = sanitizeItems(raw.items);

  if (!PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: "invalid Phone" }, { status: 400 });
  }
  try {
    const existing = await db.abandonedCheckout.findUnique({
      where: { phone },
    });

    //If this phone already bought before, a new checkout starts a fresh cycle

    await db.abandonedCheckout.upsert({
      where: { phone },
      create: { phone, name, cartItems: items },
      update: {
        name,
        cartItems: items,
        ...(existing?.converted ? { converted: false, notified: false } : {}),
      },
    });

    // Atomic claim: only ONE request can flip notified false -> true

    const claim = await db.abandonedCheckout.updateMany({
      where: { phone, notified: false },
      data: { notified: true },
    });

    if (claim.count === 1) {
      const ok = await sendToWebhook({
        event: "abandoned_checkout",
        data: { phone, name, items, capturedAt: new Date().toISOString() },
      });

      // If sending failed, release the claim so a later attempt can retry
      if (!ok) {
        await db.abandonedCheckout.updateMany({
          where: { phone },
          data: { notified: false },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[capture] error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
