import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Next.js App Router favicon convention. This generates the favicon for
// every page from the project's mesh-gradient image as a background with a
// bold "F" centered on top, so the browser tab matches the brand.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  let dataUrl: string | null = null;
  try {
    const imagePath = path.join(
      process.cwd(),
      "public",
      "image-mesh-gradient.png",
    );
    const data = await readFile(imagePath);
    dataUrl = `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    dataUrl = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: dataUrl
            ? `url(${dataUrl})`
            : "linear-gradient(135deg, #6C9DEE 0%, #283B9E 60%, #273881 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#0a1224",
          fontSize: 48,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          letterSpacing: "-0.06em",
          lineHeight: 1,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
