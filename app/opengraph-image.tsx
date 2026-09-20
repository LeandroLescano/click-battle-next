import {ImageResponse} from "next/og";

export const alt =
  "Click Battle — battle your friends in real-time browser games";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

const GRID_COLUMNS = Array.from({length: 13}, (_, index) => index);
const GRID_ROWS = Array.from({length: 7}, (_, index) => index);
const MASCOT_URL = "https://www.click-battle.com.ar/logo/logo.svg";
const tiny5Font = fetch(
  new URL("../public/fonts/Tiny5-Regular.ttf", import.meta.url)
).then((response) => response.arrayBuffer());
const handjetFont = fetch(
  new URL("../public/fonts/Handjet-SemiBold.woff", import.meta.url)
).then((response) => response.arrayBuffer());

export default async function OpenGraphImage() {
  const [tiny5FontData, handjetFontData] = await Promise.all([
    tiny5Font,
    handjetFont
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#101111",
          color: "#e6e7ec",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          padding: "58px 66px",
          position: "relative",
          width: "100%"
        }}
      >
        <div
          style={{
            bottom: 0,
            display: "flex",
            left: 0,
            opacity: 0.72,
            position: "absolute",
            right: 0,
            top: 0
          }}
        >
          {GRID_COLUMNS.map((column) => (
            <div
              key={`column-${column}`}
              style={{
                background: "#292a2b",
                bottom: 0,
                display: "flex",
                left: column * 100,
                position: "absolute",
                top: 0,
                width: 2
              }}
            />
          ))}
          {GRID_ROWS.map((row) => (
            <div
              key={`row-${row}`}
              style={{
                background: "#292a2b",
                display: "flex",
                height: 2,
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
            alignItems: "center",
            display: "flex",
            height: 500,
            justifyContent: "center",
            position: "relative",
            width: 455
          }}
        >
          <img
            alt="Click Battle mascot"
            height="470"
            src={MASCOT_URL}
            style={{objectFit: "contain"}}
            width="455"
          />
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            marginLeft: 66,
            position: "relative"
          }}
        >
          <div
            style={{
              color: "#8ca8f1",
              display: "flex",
              fontFamily: "Tiny5",
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: "0.03em",
              textTransform: "uppercase"
            }}
          >
            Click Battle!
          </div>

          <div style={{display: "flex", flexDirection: "column"}}>
            <div
              style={{
                display: "flex",
                fontFamily: "Tiny5",
                fontSize: 67,
                fontWeight: 900,
                letterSpacing: "-0.045em",
                lineHeight: 0.98,
                maxWidth: 600
              }}
            >
              Battle your friends in seconds
            </div>
            <div
              style={{
                color: "#a8b6dd",
                display: "flex",
                fontFamily: "Handjet",
                fontSize: 25,
                fontWeight: 600,
                lineHeight: 1.25,
                marginTop: 22,
                maxWidth: 565
              }}
            >
              Create, invite and play together in real time.
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              background: "#829eea",
              border: "2px solid #c8d6fa",
              borderRadius: 12,
              boxShadow: "7px 8px 0 #30458e",
              color: "#202660",
              display: "flex",
              fontFamily: "Tiny5",
              fontSize: 24,
              fontWeight: 900,
              justifyContent: "center",
              padding: "15px 22px",
              textTransform: "uppercase"
            }}
          >
            Create · Invite · Battle
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Tiny5",
          data: tiny5FontData,
          style: "normal",
          weight: 400
        },
        {
          name: "Handjet",
          data: handjetFontData,
          style: "normal",
          weight: 400
        }
      ]
    }
  );
}
