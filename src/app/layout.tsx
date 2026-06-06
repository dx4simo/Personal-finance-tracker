import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { cn } from "@/lib/utils";

const cairo = Cairo({ subsets: ["arabic"] });

export const metadata = {
  title: "Personal Finance",
  description: "Manage debts and expenses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cn(cairo.className, "min-h-screen bg-background antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
