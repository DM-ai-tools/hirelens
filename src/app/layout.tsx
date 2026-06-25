import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

/** All pages query the database — skip static generation at build time. */
export const dynamic = "force-dynamic";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "HireLens — AI Candidate Screening",
  description: "Screen every resume against the job — in seconds, not days. By DOTMappers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${poppins.className} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
