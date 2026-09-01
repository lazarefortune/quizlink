import type { Metadata } from "next";
import { Capriola, Sofia_Sans, Fredoka } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { SessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Providers } from "@/app/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getRequestTimeZone } from "@/lib/date-time/server";
import { TimeZoneProvider } from "@/lib/date-time/timezone-provider";
import { TimeZoneSync } from "@/lib/date-time/timezone-sync";
import "./globals.css";

const capriola = Capriola({
  variable: "--font-capriola",
  subsets: ["latin"],
  weight: ["400"],
});

const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const timeZone = await getRequestTimeZone();

  return (
    <html lang="fr" suppressHydrationWarning className={`${capriola.variable} ${sofiaSans.variable} ${fredoka.variable}`}>
      <body className="antialiased font-sans">
        <TimeZoneProvider key={timeZone} initialTimeZone={timeZone}>
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
                  <TimeZoneSync initialTimeZone={timeZone} />
                  <div className="flex min-h-dvh flex-col">
                    <Header />
                    <main className="flex min-h-0 flex-1 flex-col">{children}</main>
                    <Footer />
                  </div>
                </ToastProvider>
              </ThemeProvider>
              </Providers>
            </SessionProvider>
          </LocaleProvider>
        </TimeZoneProvider>
      </body>
    </html>
  );
}
