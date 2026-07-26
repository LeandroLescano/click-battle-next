import {ImageResponse} from "next/og";

export const alt = "Click Battle — multiplayer browser battles";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #24114f 0%, #4b2391 55%, #6b35bd 100%)",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            textAlign: "center"
          }}
        >
          <div
            style={{
              color: "#f6b44b",
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.18em",
              marginBottom: 30,
              textTransform: "uppercase"
            }}
          >
            Play online
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1
            }}
          >
            Click Battle
          </div>
          <div
            style={{
              color: "#e8dcff",
              display: "flex",
              fontSize: 38,
              fontWeight: 600,
              marginTop: 32
            }}
          >
            Create a room. Invite friends. Battle.
          </div>
        </div>
      </div>
    ),
    size
  );
}
