import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
            width: 390,
            height: 390,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 112,
            border: "10px solid rgba(255,255,255,0.16)",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
            boxShadow: "0 30px 70px rgba(0,0,0,0.24)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              color: "#ffffff",
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: "-10px",
            }}
          >
            B
            <span
              style={{
                color: "#f1c84b",
              }}
            >
              K
            </span>
          </div>

          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.83)",
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: "7px",
              textTransform: "uppercase",
            }}
          >
            BootKiT
          </div>

          <div
            style={{
              position: "absolute",
              right: 51,
              bottom: 51,
              width: 35,
              height: 35,
              borderRadius: 999,
              border: "7px solid #165c3a",
              background: "#f1c84b",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}