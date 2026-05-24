export default function TermsPage() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Legal</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "52px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px", lineHeight: 1 }}>
          Terms &<br /><em style={{ color: "rgba(240,237,230,0.4)" }}>Conditions.</em>
        </h1>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", letterSpacing: "0.1em", marginBottom: "8px" }}>Last updated: May 2026</p>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, marginBottom: "56px" }}>
          By using this website or placing an order, you agree to these Terms and Conditions. Please read them carefully before proceeding.
        </p>

        {[
          {
            title: "About 2Z",
            content: "2Z is a clothing brand based in Cairo, Egypt. We sell and deliver products exclusively within Egypt. Contact: super20.mh2004@gmail.com | +20 10 6517 8342."
          },
          {
            title: "Acceptance of Terms",
            content: "By accessing this website or submitting an order, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy, in accordance with Egyptian Consumer Protection Law No. 181 of 2018."
          },
          {
            title: "Acceptable Use",
            content: "This website may only be used for lawful personal purposes. You agree not to use it in any way that violates applicable laws, infringes third-party rights, or disrupts the website's operation. We reserve the right to deny access to any user who violates these terms."
          },
          {
            title: "Account Registration",
            content: "You may use this website and place orders without creating an account. If you choose to register, you are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must notify us immediately if you suspect unauthorized access."
          },
          {
            title: "Product Descriptions & Pricing",
            content: "All prices are in Egyptian Pounds (EGP) and include applicable taxes. Prices and product availability may change without prior notice. While we strive for accuracy, product images and descriptions are for reference only and minor variations may occur. We reserve the right to correct any pricing errors before confirming your order."
          },
          {
            title: "Order Submission & Acceptance",
            content: "By submitting an order, you enter into a binding purchase agreement and commit to paying the specified price. You will receive an order confirmation by email or WhatsApp. We reserve the right to refuse or cancel any order at our discretion, including cases of suspected fraud, pricing errors, or unavailability. You will be notified promptly in such cases."
          },
          {
            title: "Retention of Ownership",
            content: "Ownership of ordered products does not transfer to you until full payment has been received. For cash on delivery orders, ownership transfers at the moment of successful payment upon delivery."
          },
          {
            title: "Payment Methods",
            content: "Currently accepted payment method: Cash on Delivery. Additional methods (Vodafone Cash, InstaPay, credit/debit cards) will be added in the future. Payment is due at the time of delivery for cash on delivery orders. We reserve the right to cancel orders where payment is refused upon delivery."
          },
          {
            title: "Delivery",
            content: "We deliver within Egypt only. Delivery times are estimates and not guaranteed. We are not liable for delays caused by courier partners, incorrect address information, or events beyond our control. You are responsible for providing a complete and accurate delivery address. Delivery fees, if any, are shown at checkout."
          },
          {
            title: "Failed Delivery",
            content: "If delivery fails due to an incorrect address or the recipient being unavailable, we will contact you to arrange a second delivery attempt. Any additional delivery costs incurred after a second failed attempt will be at your expense. Uncollected orders may be returned and the order cancelled."
          },
          {
            title: "Returns & Exchanges",
            content: "We accept returns within 14 days of delivery in accordance with Egyptian Consumer Protection Law. Items must be unworn, unwashed, and in original condition with all tags attached. Sale items are non-returnable. To initiate a return, contact us via WhatsApp at +20 10 6517 8342 or email at super20.mh2004@gmail.com. Return shipping costs are the customer's responsibility unless the item is defective or incorrect."
          },
          {
            title: "Refunds",
            content: "Refunds are processed within 7–14 business days of receiving and inspecting the returned item. For cash on delivery orders, refunds are issued via Vodafone Cash or bank transfer. We reserve the right to refuse a refund if the item does not meet our return conditions."
          },
          {
            title: "Intellectual Property",
            content: "All content on this website — including logos, images, text, product designs, and layout — is the exclusive property of 2Z and is protected under applicable intellectual property laws. You may not reproduce, copy, distribute, or use any content without our prior written consent."
          },
          {
            title: "Limitation of Liability",
            content: "To the maximum extent permitted by Egyptian law, 2Z shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or our products. Our total liability shall not exceed the amount paid for the specific order in question. Nothing in these terms excludes liability for personal injury, fraud, or any liability that cannot be excluded by law."
          },
          {
            title: "Severability",
            content: "If any provision of these Terms is found to be invalid or unenforceable under applicable law, that provision shall be modified to the minimum extent necessary to make it enforceable. All other provisions shall remain in full force and effect."
          },
          {
            title: "Changes to Terms",
            content: "We reserve the right to update these Terms and Conditions at any time. Changes take effect immediately upon publication on this website. Your continued use of the website after any changes constitutes acceptance of the revised terms. The date of the last revision is always shown at the top of this page."
          },
          {
            title: "Governing Law & Jurisdiction",
            content: "These Terms are governed by the laws of the Arab Republic of Egypt, including Consumer Protection Law No. 181 of 2018 and Personal Data Protection Law No. 151 of 2020. Any disputes shall be subject to the exclusive jurisdiction of Egyptian courts in Cairo."
          },
          {
            title: "Contact",
            content: "For any questions regarding these Terms, contact us at 2z.eg2004@gmail.com or +20 10 6517 8342. We are available daily - 24/7."
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