type WebhookEvent = "abandoned_checkout" | "checkout_converted" | "new_order";

type WebhookPayload = {
  event: WebhookEvent;
  data: Record<string, unknown>;
};

// كل event بيروح على لينك n8n بتاعه (اسم الـ env var اللي فيه اللينك)
const URL_ENV: Record<WebhookEvent, string> = {
  abandoned_checkout: "AUTOMATION_WEBHOOK_URL",
  checkout_converted: "AUTOMATION_WEBHOOK_URL",
  new_order: "NEW_ORDER_WEBHOOK_URL",
};

export async function sendToWebhook(payload: WebhookPayload): Promise<boolean> {
  const envName = URL_ENV[payload.event];
  const url = process.env[envName];

  // No URL set: do nothing, never crash
  if (!url) {
    console.warn(`[webhook] ${envName} is not set, skipping`);
    return false;
  }

  // Timeout to a slow/dead link can never hang our API route
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.ok) {
      console.log(`[webhook] ${payload.event} sent OK (${res.status})`);
    } else {
      console.error(`[webhook] ${payload.event} rejected: HTTP ${res.status}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[webhook] Failed ", err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
