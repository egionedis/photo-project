import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EB_Garamond } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://edgargionedis.com")
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={ebGaramond.variable}>
        <Header />
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
