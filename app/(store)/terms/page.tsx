import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "2Z Store's terms and conditions — shipping, returns, and order policies.",
  alternates: { canonical: "https://www.2zstore.com/terms" },
}

export default function TermsPage() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Legal</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "52px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px", lineHeight: 1 }}>
          Terms &<br /><em style={{ color: "rgba(240,237,230,0.4)" }}>Conditions.</em>
        </h1>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, marginBottom: "56px" }}>
          By using this website or placing an order, you agree to these Terms and Conditions. Please read them carefully before proceeding.
        </p>

        {[
          {
            title: "Order Acceptance",
            content: "By placing an order with 2Z, customers fully agree to adhere to these Terms and Conditions."
          },
          {
            title: "Legal Compliance",
            content: "Nothing in these terms limits or overrides mandatory consumer rights under applicable Egyptian laws."
          },
          {
            title: "Pricing & Availability",
            content: "All orders are subject to product availability. Prices are explicitly displayed in Egyptian Pounds (EGP)."
          },
          {
            title: "Product Representation",
            content: "Product colours may vary slightly from the actual items due to individual screen settings and display configurations."
          },
          {
            title: "Order Cancellation",
            content: "2Z reserves the right to cancel any orders suspected of fraud or those containing technical errors. In such cases, any eligible payments will be fully refunded."
          },
          {
            title: "Shipping Coverage",
            content: "2Z currently limits its shipping operations exclusively to Cairo and Giza."
          },
          {
            title: "Processing & Delivery",
            content: "Orders are typically processed within 24 hours of placement and delivered within 1–3 business days. Delivery estimates are approximate and may vary due to public holidays, severe weather conditions, heavy traffic, or unforeseen courier delays."
          },
          {
            title: "Return, Refund & Exchange",
            content: "Customers retain all mandatory protection and rights granted under the Egyptian Consumer Protection Law. To be eligible for a return or exchange, products must normally be sent back unused, unwashed, and with all original tags attached. Issues regarding manufacturing defects or incorrectly shipped items will be handled entirely at 2Z's expense following proper verification."
          },
          {
            title: "Payment Methods",
            content: "We accept payments via Cash on Delivery (COD) and InstaPay. To ensure your financial security, 2Z does not intentionally store complete payment details on its servers. Orders may undergo a verification process to mitigate fraud and secure transactions."
          },
          {
            title: "Intellectual Property",
            content: "All brand logos, trademarks, photographs, graphics, and textual website content are the exclusive property of 2Z unless stated otherwise. Any unauthorized commercial copying, reproduction, or reuse of these materials without explicit written permission is strictly prohibited."
          },
          {
            title: "Complaints & Contact",
            content: "For any inquiries, feedback, or support, customers can reach us via email at 2z.eg2004@gmail.com. All customer complaints will be thoroughly reviewed and addressed as promptly as reasonably possible."
          },
          {
            title: "Governing Law",
            content: "These policies, terms, and conditions are fully governed by and construed in accordance with the laws of the Arab Republic of Egypt. Nothing within this document waives or removes mandatory consumer rights provided by Egyptian law."
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: "40px", paddingBottom: "40px", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px" }}>
              {String(i + 1).padStart(2, "0")}. {section.title}
            </p>
            <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.65)", lineHeight: 2, letterSpacing: "0.05em" }}>
              {section.content}
            </p>
          </div>
        ))}

      </div>
    </div>
  )
}