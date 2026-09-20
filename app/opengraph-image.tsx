import {ImageResponse} from "next/og";

export const alt =
  "Click Battle — create a room and challenge friends in real-time browser battles";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

const GRID_COLUMNS = Array.from({length: 13}, (_, index) => index);
const GRID_ROWS = Array.from({length: 7}, (_, index) => index);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #17172b 0%, #202660 100%)",
          color: "#f9f9f9",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          padding: "62px 68px",
          position: "relative",
          width: "100%"
        }}
      >
        <div
          style={{
            bottom: 0,
            display: "flex",
            left: 0,
            opacity: 0.2,
            position: "absolute",
            right: 0,
            top: 0
          }}
        >
          {GRID_COLUMNS.map((column) => (
            <div
              key={`column-${column}`}
              style={{
                background: "#5463e6",
                bottom: 0,
                display: "flex",
                left: column * 100,
                position: "absolute",
                top: 0,
                width: 1
              }}
            />
          ))}
          {GRID_ROWS.map((row) => (
            <div
              key={`row-${row}`}
              style={{
                background: "#5463e6",
                display: "flex",
                height: 1,
                left: 0,
                position: "absolute",
                right: 0,
                top: row * 100
              }}
            />
          ))}
        </div>

        <div
          style={{
            background: "radial-gradient(circle, #5463e6 0%, transparent 68%)",
            borderRadius: 999,
            display: "flex",
            height: 380,
            opacity: 0.38,
            position: "absolute",
            right: -100,
            top: -140,
            width: 380
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
        >
          <div style={{alignItems: "center", display: "flex"}}>
            <div
              style={{
                alignItems: "center",
                background: "#f6b44b",
                border: "4px solid #17172b",
                borderRadius: 18,
                boxShadow: "6px 7px 0 #8ca8f1",
                color: "#202660",
                display: "flex",
                fontSize: 30,
                fontWeight: 900,
                height: 72,
                justifyContent: "center",
                marginRight: 24,
                width: 72
              }}
            >
              CB
            </div>
            <div
              style={{
                color: "#c8d6fa",
                display: "flex",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase"
              }}
            >
              Real-time browser battles
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", maxWidth: 630}}>
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 900,
                letterSpacing: "-0.055em",
                lineHeight: 0.92
              }}
            >
              Click Battle
            </div>
            <div
              style={{
                color: "#c8d6fa",
                display: "flex",
                fontSize: 34,
                fontWeight: 650,
                lineHeight: 1.2,
                marginTop: 28,
                maxWidth: 590
              }}
            >
              Create a room, pick a mode and challenge your friends.
            </div>
          </div>

          <div style={{display: "flex", gap: 14}}>
            {["Instant rooms", "No download", "Play together"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(200, 214, 250, 0.12)",
                  border: "2px solid rgba(200, 214, 250, 0.55)",
                  borderRadius: 999,
                  color: "#c8d6fa",
                  display: "flex",
                  fontSize: 20,
                  fontWeight: 750,
                  padding: "10px 18px"
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            alignItems: "stretch",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            justifyContent: "center",
            marginLeft: 48,
            position: "relative",
            width: 390
          }}
        >
          <div
            style={{
              background: "#f9f9f9",
              border: "4px solid #5463e6",
              borderRadius: 24,
              boxShadow: "8px 9px 0 #758fd1",
              color: "#202660",
              display: "flex",
              flexDirection: "column",
              padding: "25px 28px"
            }}
          >
            <div
              style={{
                color: "#4255ba",
                display: "flex",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Speed Battle
            </div>
            <div
              style={{
                alignItems: "flex-end",
                display: "flex",
                justifyContent: "space-between",
                marginTop: 18
              }}
            >
              <div style={{display: "flex", fontSize: 68, fontWeight: 900, lineHeight: 1}}>
                128
              </div>
              <div
                style={{
                  background: "#202660",
                  borderRadius: 12,
                  color: "#f9f9f9",
                  display: "flex",
                  fontSize: 19,
                  fontWeight: 800,
                  padding: "9px 13px"
                }}
              >
                CLICKS
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#30458e",
              border: "4px solid #8ca8f1",
              borderRadius: 24,
              boxShadow: "8px 9px 0 #17172b",
              color: "#f9f9f9",
              display: "flex",
              flexDirection: "column",
              padding: "25px 28px"
            }}
          >
            <div
              style={{
                color: "#c8d6fa",
                display: "flex",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Reaction Battle
            </div>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
                marginTop: 18
              }}
            >
              <div style={{display: "flex", fontSize: 55, fontWeight: 900, lineHeight: 1}}>
                GO!
              </div>
              <div
                style={{
                  border: "3px solid #f6b44b",
                  borderRadius: 999,
                  display: "flex",
                  height: 30,
                  width: 30
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
