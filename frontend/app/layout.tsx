import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Оформление билетов" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
