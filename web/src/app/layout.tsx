import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { PrefsProvider } from "@/components/PrefsProvider";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

/** Evita flash de tema incorrecto antes de hidratar prefs. */
const prefsBootScript = `
(function(){
  try {
    var raw = localStorage.getItem("creatoros_prefs_v1");
    var prefs = raw ? JSON.parse(raw) : {};
    var theme = prefs.theme === "light" || prefs.theme === "dark" || prefs.theme === "system" ? prefs.theme : "system";
    var locale = prefs.locale === "en" ? "en" : "es";
    var reduce = prefs.reduceMotion === true;
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : theme;
    var html = document.documentElement;
    html.setAttribute("data-theme", resolved);
    html.setAttribute("data-theme-pref", theme);
    html.lang = locale;
    html.setAttribute("data-reduce-motion", reduce ? "true" : "false");
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: "Ideazo",
  description: "De idea a listo para grabar.",
  applicationName: "Ideazo",
  appleWebApp: {
    capable: true,
    title: "Ideazo",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsBootScript }} />
      </head>
      <body className={`${manrope.variable} ${syne.variable} antialiased`}>
        <PrefsProvider>
          <AuthProvider>
            {children}
            <PwaRegister />
          </AuthProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
