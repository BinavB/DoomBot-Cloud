import type { Metadata, Viewport } from "next";
import { Figtree, Sora } from "next/font/google";
import "material-symbols/sharp.css";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "DOOMBOT", template: "%s | DOOMBOT" },
  description: "A personal proactive AI agent",
  appleWebApp: { capable: true, title: "DOOMBOT", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d1210",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${sora.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
