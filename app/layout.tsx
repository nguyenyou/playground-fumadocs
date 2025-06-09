import "./global.css";
import { Provider } from "./provider";
import type { ReactNode } from "react";
import { fontMono, fontSans } from "./fonts";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontSans.className} suppressHydrationWarning>
      <body className={`flex flex-col min-h-screen ${fontMono.variable} ${fontSans.variable}`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
