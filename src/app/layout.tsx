import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"; // [!code ++]
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({ // [!code ++]
  variable: "--font-playfair", // [!code ++]
  subsets: ["latin"], // [!code ++]
}); // [!code ++]

export const metadata: Metadata = {
  title: "EverLoved",
  description: "AI Companion & Caregiver Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`} // [!code ++]
      >
        {children}
      </body>
    </html>
  );
}
