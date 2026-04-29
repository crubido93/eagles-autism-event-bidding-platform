import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/AmplifyProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Eagles Autism Foundation Fundraiser | McCloskey's, May 2",
  description:
    "Join us at McCloskey's in Ardmore on Saturday, May 2nd to raise money for the Eagles Autism Foundation. Bid on exclusive items and experiences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
