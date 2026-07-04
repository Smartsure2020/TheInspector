import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/lib/role";

export const metadata: Metadata = {
  title: "The Inspector (prototype)",
  description:
    "Acorn virtual assessment workflow prototype — placeholder access, role-play data only",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
