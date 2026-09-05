import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Acadexa — Academic Research & Professional Platform",
    template: "%s | Acadexa",
  },
  description:
    "Discover research, connect with experts, and advance knowledge. A professional platform for researchers, professors, and students.",
  keywords: [
    "academic research",
    "research papers",
    "researchers",
    "professors",
    "university",
    "academic network",
    "research collaboration",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Acadexa",
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
