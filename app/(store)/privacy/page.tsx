export default function PrivacyPage() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Legal</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "52px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px", lineHeight: 1 }}>
          Privacy<br /><em style={{ color: "rgba(240,237,230,0.4)" }}>&amp; Policy.</em>
        </h1>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, marginBottom: "56px" }}>
          This page explains how 2Z collects, uses, and protects your personal data, and covers our cookie usage.
        </p>

        {[
          {
            title: "Data We Collect",
            content: "2Z may collect essential customer information, including names, phone numbers, delivery addresses, email addresses, order histories, and basic technical browsing data needed to operate the website."
          },
          {
            title: "How We Use Your Data",
            content: "This information is used strictly to process your transactions, provide customer support, improve our services, and comply with our legal obligations. We do not use your data for purposes beyond these."
          },
          {
            title: "Data Sharing",
            content: "2Z values your privacy and does not sell your personal information to third parties. Your data is shared with third-party shipping and payment providers only when necessary to complete and deliver your order."
          },
          {
            title: "Data Retention",
            content: "Personal data is retained only for as long as reasonably necessary to fulfill the purposes outlined in this policy, after which it is securely handled in line with applicable regulations."
          },
          {
            title: "Your Rights",
            content: "You have the right to request the correction of any inaccurate personal information we hold about you, subject to applicable regulations. To exercise this right, contact us at 2z.eg2004@gmail.com."
          },
          {
            title: "Cookies",
            content: "Cookies may be used to optimize website functionality, elevate your user experience, and gather analytical data. You can manage or disable cookies at any time via your browser settings."
          },
          {
            title: "Children's Privacy",
            content: "2Z does not knowingly collect, store, or solicit personal data from children."
          },
          {
            title: "Governing Law",
            content: "This policy is governed by and construed in accordance with the laws of the Arab Republic of Egypt. Nothing within this policy waives or removes mandatory consumer rights provided by Egyptian law."
          },
          {
            title: "Contact",
            content: "For any inquiries, feedback, or support regarding this policy, reach us via email at 2z.eg2004@gmail.com. All customer complaints will be thoroughly reviewed and addressed as promptly as reasonably possible."
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