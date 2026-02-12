import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IELTS Test Builder - Mockmee",
  description:
    "Professional IELTS test content management tool for creating and managing reading, listening, and writing tests.",
};

export default function IELTSTestBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} antialiased`}
        style={{ margin: 0, padding: 0 }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Provider>
            {children}
            <Toaster />
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
