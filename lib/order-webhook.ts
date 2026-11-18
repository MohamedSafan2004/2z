import { db } from "@/lib/db";
import { sendToWebhook } from "@/lib/webhook";

// بيجيب الأوردر من الداتابيز بالـ id ويبعت تفاصيله للينك (n8n).
// بياخد id بس (مش الأوردر كله) عشان يبقى فيه مصدر واحد للبيانات،
// ومبيرميش ايرور أبداً — لو فشل بيرجع false والأوردر نفسه مش بيتأثر.
export async function sendOrderToWebhook(orderId: string): Promise<boolean> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { name: true } } },
    });

    if (!order) return false;

    return await sendToWebhook({
      event: "new_order",
      data: {
        orderNumber:
          order.invoiceNumber != null
            ? `INV-${String(order.invoiceNumber).padStart(4, "0")}`
            : order.id,
        orderId: order.id,
        name: order.user?.name || order.guestName || "Guest",
        phone: order.phone ?? "",
        address: order.address ?? "",
        city: order.city ?? "",
        items: order.items.map((item) => ({
          name: item.productNameSnapshot,
          color: item.colorSnapshot,
          size: item.sizeSnapshot,
          quantity: item.quantity,
          isGift: item.isGift,
        })),
        total: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "[order-webhook] failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
