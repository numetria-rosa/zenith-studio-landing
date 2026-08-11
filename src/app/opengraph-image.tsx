import { ImageResponse } from "next/og";

// Auto-generated social share card. Shows whenever the site is linked on
// Instagram, WhatsApp, X, LinkedIn, or Slack, so link shares stop looking bare.
export const alt = "Zenith Studio: AI automation systems for modern business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#05060a",
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(111,144,255,0.32), transparent 42%), radial-gradient(circle at 84% 20%, rgba(216,82,255,0.28), transparent 38%), radial-gradient(circle at 50% 100%, rgba(0,183,255,0.22), transparent 45%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 26,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6f90ff, #d852ff)",
              display: "flex",
            }}
          />
          Zenith Studio
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 82,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            marginTop: 34,
          }}
        >
          <div style={{ display: "flex" }}>Put your busywork</div>
          <div style={{ display: "flex", color: "#7fdfff" }}>on autopilot.</div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(255,255,255,0.66)",
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          AI automation systems that capture leads, book appointments, and clear
          your inbox. Live in 7 days.
        </div>

        <div style={{ display: "flex", gap: "14px", marginTop: 40 }}>
          {["n8n workflows", "AI receptionist", "Lead capture"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                fontSize: 24,
                padding: "10px 22px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
