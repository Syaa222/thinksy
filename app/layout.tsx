import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "thinksy - Pendamping Belajar Matematika Kelas 8",
  description: "Platform pembelajaran mandiri berbasis AI Multi-Tenant",
};

import DemoRoleSwitcher from "@/components/demo/DemoRoleSwitcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DemoRoleSwitcher />
      </body>
    </html>
  );
}
