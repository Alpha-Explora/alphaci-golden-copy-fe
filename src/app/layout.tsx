import type { Metadata, Viewport } from "next";
import { Doto, Plus_Jakarta_Sans, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const displayFont = Doto({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Doto({
  variable: "--font-body",
  subsets: ["latin"],
});

const dashBodyFont = Plus_Jakarta_Sans({
  variable: "--font-dash-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dashDisplayFont = Outfit({
  variable: "--font-dash-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AlphaCI | Governed CI/CD Workspace",
  description:
    "Create governed CI/CD workflows, branch gates, environments, and release visibility from one AlphaCI workspace.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={cn("dark font-sans", geist.variable)}>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${dashBodyFont.variable} ${dashDisplayFont.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
