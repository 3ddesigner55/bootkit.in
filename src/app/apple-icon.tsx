import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #1b7048 0%, #10472d 100%)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 144,
            height: 144,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 42,
            border: "4px solid rgba(255,255,255,0.17)",
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              color: "#ffffff",
              fontSize: 54,
              fontWeight: 900,
              letterSpacing: "-5px",
            }}
          >
            B
            <span style={{ color: "#f1c84b" }}>K</span>
          </div>

          <div
            style={{
              marginTop: 2,
              color: "rgba(255,255,255,0.82)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            BootKiT
          </div>

          <div
            style={{
              position: "absolute",
              right: 17,
              bottom: 17,
              width: 14,
              height: 14,
              borderRadius: 999,
              border: "3px solid #165c3a",
              background: "#f1c84b",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}