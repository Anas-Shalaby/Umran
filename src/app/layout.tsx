import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const umranFont = localFont({
  src: "../../fonts/alfont_com_AAJannatLT-.ttf",
  display: "swap",
  variable: "--font-umran",
});

export const metadata: Metadata = {
  title: "عمران",
  description:
    "منصة عُمران تجمع العمل العميق والعادات الروحية داخل أفواج تبني الإنجاز اليومي للأمة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={umranFont.variable} suppressHydrationWarning>
      <body className="font-arabic antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster dir="rtl" richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
