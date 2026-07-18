export default function PrivacyPage() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Legal</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "52px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px", lineHeight: 1 }}>
          Privacy<br /><em style={{ color: "rgba(240,237,230,0.4)" }}>Policy.</em>
        </h1>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", letterSpacing: "0.1em", marginBottom: "8px" }}>Last updated: May 2026</p>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, marginBottom: "56px" }}>
          This policy is compliant with Egypt&apos;s Personal Data Protection Law No. 151 of 2020 (PDPL).
        </p>

        {[
          {
            title: "Who We Are",
            content: "2Z is a clothing brand based in Cairo, Egypt. We operate through this website to sell and deliver our products within Egypt. For any privacy-related inquiries, contact us at super20.mh2004@gmail.com or +20 10 6517 8342."
          },
          {
            title: "What Data We Collect",
            content: "We collect only the minimum data necessary to process your order: full name, email address, phone number, and delivery address. We do not collect payment card details — cash on delivery orders require no payment information. When you visit our website, we may collect basic usage data such as browser type and pages visited."
          },
          {
            title: "Why We Collect Your Data",
            content: "Your data is collected solely for the following purposes: to process and fulfill your order, to arrange delivery to your address, to contact you regarding your order status, and to respond to any customer service requests. We do not use your data for marketing unless you explicitly consent."
          },
          {
            title: "Legal Basis for Processing",
            content: "Under Egypt's PDPL No. 151 of 2020, we process your data based on: (a) your consent when placing an order, and (b) the necessity of fulfilling the contract between you and 2Z. We do not process your data beyond what is required for these purposes."
          },
          {
            title: "Data Sharing",
            content: "We do not sell, rent, or share your personal data with third parties for marketing or commercial purposes. Your data may be shared only with delivery partners strictly for the purpose of fulfilling your order. All third parties are required to handle your data securely and in accordance with applicable law."
          },
          {
            title: "Data Retention",
            content: "We retain your order data for a period necessary to fulfill legal and accounting obligations, typically not exceeding two years after your last order. After this period, your data is securely deleted unless required by law to be retained longer."
          },
          {
            title: "Your Rights Under Egypt's PDPL",
            content: "Under Egypt's Personal Data Protection Law, you have the right to: access your personal data, correct inaccurate data, request deletion of your data, object to processing, and withdraw consent at any time. To exercise any of these rights, contact us at super20.mh2004@gmail.com. We will respond within 30 days."
          },
          {
            title: "Cookies",
            content: "We use only essential cookies required for the website to function — including your shopping cart session and login state. We do not use advertising, tracking, or analytics cookies. You may disable cookies in your browser settings, though this may affect website functionality."
          },
          {
            title: "Data Security",
            content: "We implement appropriate technical measures to protect your personal data against unauthorized access, alteration, or loss. Our database is hosted on a secure cloud platform with encrypted connections (SSL/TLS). Access to customer data is strictly limited."
          },
          {
            title: "Children's Privacy",
            content: "Our website is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately."
          },
          {
            title: "Changes to This Policy",
            content: "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. The date of the latest revision will always be displayed at the top of this page. Continued use of the website after changes constitutes acceptance of the updated policy."
          },
          {
            title: "Contact & Complaints",
            content: "For any questions or complaints regarding this Privacy Policy or our data practices, contact us at super20.mh2004@gmail.com or +20 10 6517 8342. You may also file a complaint with Egypt's Data Protection Centre (PDPC) if you believe your rights have been violated."
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