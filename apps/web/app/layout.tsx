import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Esylana - Beauty Clinic Management SaaS",
  description: "Professional booking and management system for beauty clinics and aesthetic practices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
