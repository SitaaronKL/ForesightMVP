import "./globals.css";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import type { ReactNode } from "react";

export const metadata = {
  title: "Foresight Care",
  description: "Care operations for CCM and APCM nurses.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen font-sans text-brand-950">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
