import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ReportProvider } from "@/contexts/ReportContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VentureIQ — AI-Powered Business Intelligence",
  description:
    "Analyse your business in 90 seconds. AI-driven P&L analysis, risk forecasting, industry benchmarking, and opportunity cost calculations with client-side preprocessing and secure server-side inference.",
  keywords: [
    "AI business intelligence",
    "P&L analysis",
    "risk assessment",
    "industry benchmark",
    "business analytics",
  ],
  openGraph: {
    title: "VentureIQ — AI-Powered Business Intelligence",
    description: "Analyse your business in 90 seconds with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CompanyProvider>
          <ReportProvider>{children}</ReportProvider>
        </CompanyProvider>
      </body>
    </html>
  );
}
