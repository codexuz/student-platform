import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mockmee - IELTS Exam Practice Platform for Students",
  description: "A comprehensive platform for students to practice and excel in their exams with personalized AI recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} antialiased`}
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
