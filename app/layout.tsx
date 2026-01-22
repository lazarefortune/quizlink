import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { SessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "QuizLink - Créez et partagez des quiz en ligne",
    template: "%s | QuizLink",
  },
  description: "Créez, partagez et analysez des quiz interactifs. Générez des quiz avec l'IA à partir de votre contenu ou créez-les manuellement.",
  keywords: ["quiz", "questionnaire", "créer quiz", "partager quiz", "quiz en ligne", "génération IA"],
  authors: [{ name: "Lazare Fortune", url: "https://lazarefortune.com" }],
  creator: "Lazare Fortune",
  publisher: "Lazare Fortune",
  icons: {
    icon: "/logo-quizlink.png",
    apple: "/logo-quizlink.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "QuizLink",
    title: "QuizLink - Créez et partagez des quiz en ligne",
    description: "Créez, partagez et analysez des quiz interactifs. Générez des quiz avec l'IA à partir de votre contenu.",
  },
  twitter: {
    card: "summary",
    title: "QuizLink - Créez et partagez des quiz en ligne",
    description: "Créez, partagez et analysez des quiz interactifs. Générez des quiz avec l'IA à partir de votre contenu.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={quicksand.variable}>
      <body
        className="antialiased"
        style={{ fontFamily: "var(--font-quicksand), system-ui, sans-serif" }}
      >
        <LocaleProvider>
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ToastProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ToastProvider>
            </ThemeProvider>
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
