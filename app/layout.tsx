import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// BoldPixels by YukiPixels — CC BY-SA 4.0 (ดู app/fonts/BoldPixels-LICENSE.txt)
const boldPixels = localFont({
  src: "./fonts/BoldPixels.woff2",
  variable: "--font-boldpixels",
});

export const metadata: Metadata = {
  title: "Verb-Noun Cauldron",
  description: "Combine verbs and nouns in the cauldron to defeat monsters",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${boldPixels.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-pixel">
        {children}
      </body>
    </html>
  );
}
