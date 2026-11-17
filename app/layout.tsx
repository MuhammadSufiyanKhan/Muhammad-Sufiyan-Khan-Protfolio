import type { Metadata, Viewport } from "next";
import { Syne, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Syne({ subsets: ["latin"], variable: "--nf-display", weight: ["500", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--nf-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--nf-mono", weight: ["400", "500"] });

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
    <html lang="en" data-theme="paper" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
