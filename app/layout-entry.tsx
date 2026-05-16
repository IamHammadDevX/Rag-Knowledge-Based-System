import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import AppProviders from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Knowledge Intelligence System",
  description: "Enterprise RAG-ready SaaS foundation with modular integrations",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

function App({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

export default App;
