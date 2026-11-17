import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";

const display = Syne({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Muhammad Sufiyan Khan — Full-Stack Web Developer",
  description:
    "Portfolio of Muhammad Sufiyan Khan, a BS Computer Science graduate and MERN stack developer building fast, expressive web experiences.",
  openGraph: {
    title: "Muhammad Sufiyan Khan — Full-Stack Web Developer",
    description: "MERN stack developer. Next.js, GSAP, Three.js.",
    type: "website",
  },
};
export const viewport: Viewport = { themeColor: "#0a0a0b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
