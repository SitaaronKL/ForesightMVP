import "./globals.css";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import { OriginTracker } from "../components/OriginTracker";
import type { ReactNode } from "react";

export const metadata = {
  title: "ForesightHealth",
  description: "Care operations for CCM and APCM nurses.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-screen font-sans text-brand-950">
        <ConvexClientProvider>
          <OriginTracker />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
