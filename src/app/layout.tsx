import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CAREVO",
  description: "CAREVO ist eine deutschsprachige Anwendung fuer klinische und pflegerische Dokumentation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
