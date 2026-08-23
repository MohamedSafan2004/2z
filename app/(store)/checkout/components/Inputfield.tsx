"use client"

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  hint?: string
  multiline?: boolean
  rows?: number
}

export default function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  multiline = false,
  rows = 3,
}: InputFieldProps) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: multiline ? "auto" : "54px",
    minHeight: multiline ? "84px" : undefined,
    padding: multiline ? "14px 16px" : "0 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1.5px solid rgba(240,237,230,0.14)",
    borderRadius: "14px",
    color: "#f0ede6",
    fontFamily: "Space Mono, monospace",
    fontSize: "14.5px",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: multiline ? 1.5 : undefined,
    resize: multiline ? "none" : undefined,
    transition: "border-color 0.18s ease, background 0.18s ease",
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(240,237,230,0.6)"
    e.currentTarget.style.background = "rgba(255,255,255,0.04)"
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(240,237,230,0.14)"
    e.currentTarget.style.background = "rgba(255,255,255,0.02)"
  }

  return (
    <div>
      <label style={{ fontSize: "10.5px", letterSpacing: "0.06em", color: "#f0ede6", marginBottom: "9px", display: "block" }}>
        {label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} rows={rows} placeholder={placeholder} style={inputStyle} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} placeholder={placeholder} style={inputStyle} />
      )}
      {hint && <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", marginTop: "8px", lineHeight: 1.55 }}>{hint}</p>}
    </div>
  )
}