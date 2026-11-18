const PHONE_REGEX = /^01[0125][0-9]{8}$/;

type capturedItem = {
  name: string;
  color: string;
  size: string;
  quantity: number;
};

let lastSentPhone = "";

export async function captureCheckout(
  phone: string,
  name: string,
  items: capturedItem[],
): Promise<void> {
  const clean = phone.replace(/\s/g, "");

  // Only a valid number, and only once per number
  if (!PHONE_REGEX.test(clean) || clean === lastSentPhone) return;
  lastSentPhone = clean;

  try {
    const res = await fetch("/api/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: clean, name, items }),
      keepalive: true,
    });
    if (!res.ok) {
      lastSentPhone = "";
    }
  } catch {
    lastSentPhone = "";
  }
}
