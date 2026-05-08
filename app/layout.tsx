import type { Metadata } from "next";
import { Capriola, Rubik, Sofia_Sans, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { SessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Providers } from "@/app/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FeedbackButton } from "@/components/feedback-button";
import "./globals.css";

const capriola = Capriola({
  variable: "--font-capriola",
  subsets: ["latin"],
  weight: ["400"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "QuizLink - Créez et partagez des quiz en ligne",
    template: "%s | QuizLink",
  },
  description: "Créez, partagez et analysez des quiz interactifs. Générez des quiz avec l'IA à partir de ton contenu ou créez-les manuellement.",
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
    description: "Créez, partagez et analysez des quiz interactifs. Générez des quiz avec l'IA à partir de ton contenu.",
  },
  twitter: {
    card: "summary",
    title: "QuizLink - Créez et partagez des quiz en ligne",
    description: "Créez, partagez et analysez des quiz interactifs. Générez des quiz avec l'IA à partir de ton contenu.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${capriola.variable} ${rubik.variable} ${sofiaSans.variable} ${nunito.variable}`}>
      <body className="antialiased font-sans">
        <LocaleProvider>
          <SessionProvider>
            <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ToastProvider>
                <div className="flex min-h-dvh flex-col">
                  <Header />
                  <main className="flex min-h-0 flex-1 flex-col">{children}</main>
                  <Footer />
                  <FeedbackButton />
                </div>
              </ToastProvider>
            </ThemeProvider>
            </Providers>
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
