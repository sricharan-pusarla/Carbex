import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carbex | Trusted Carbon Credit Marketplace",
  description: "Discover, evaluate and retire carbon credits with transparent project data and a data-driven Carbon Trust Score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-background text-foreground antialiased`}>
        <Providers>
          <TooltipProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
