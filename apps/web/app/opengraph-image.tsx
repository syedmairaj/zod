import { ImageResponse } from "next/og";

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
          background: "#0a0c0f",
          color: "#f3f4f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#5b8cff", fontSize: 28, fontWeight: 700 }}>
          Zod.ai
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          The reliability layer for AI-generated code.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: "#9aa2ad", maxWidth: 820 }}>
          Deterministic checks, independent AI verification, and an audit trail for every
          agent-written pull request.
        </div>
      </div>
    ),
    { ...size },
  );
}
