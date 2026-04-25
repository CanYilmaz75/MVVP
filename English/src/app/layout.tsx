import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CAREVO",
  description: "Ambient clinical documentation for physician workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
