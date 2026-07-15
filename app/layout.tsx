import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promise Keeper",
  description: "A playful assistant for keeping the promises hidden in everyday messages.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
