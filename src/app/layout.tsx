import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--ns-font-sans-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Northstar",
  description: "Northstar — Loma Linda University Health project management.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/app-icon-180x180.png", sizes: "180x180" }],
  },
};

/** Applies the saved theme before first paint so there is no light-to-dark
 *  flash. Mirrors the logic in ThemeToggle. */
/** Applies the saved navigator state before first paint, so a collapsed rail
 *  does not flash open on load. Pairs with the nav-closed: variant. */
const navScript = `
(function () {
  try {
    if (localStorage.getItem("northstar:nav") === "closed") {
      document.documentElement.setAttribute("data-nav", "closed");
    }
  } catch (e) {}
})();
`;

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem("ns-theme") || "system";
    var dark = t === "dark" || (t === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: navScript }} />
      </head>
      <body
        className={openSans.variable}
        style={{
          fontFamily:
            "var(--ns-font-sans-loaded), 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
