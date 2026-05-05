"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-context";

export function Footer() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { openConsentPanel } = useCookieConsent();

  const hideFooter =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/generate") ||
    pathname?.startsWith("/builder") ||
    pathname?.startsWith("/account");
  if (hideFooter) {
    return null;
  }

  return (
    <footer className="border-t-2 border-border bg-background py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 mb-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary header-logo-shadow">
              <span className="font-nunito text-sm font-black text-primary-foreground">Q</span>
            </div>
            <span className="font-nunito font-extrabold text-foreground">QuizLink</span>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t(locale, "footer.about.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t(locale, "footer.about.description")}
            </p>
            <div className="text-sm text-muted-foreground">
              <p>
                {t(locale, "footer.about.author")}:{" "}
                <Link
                  href="https://lazarefortune.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Lazare Fortune
                </Link>
              </p>
            </div>
          </div>

          {/* Legal & Explore */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t(locale, "footer.legal.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/quizzes"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(locale, "nav.publicQuizzes")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(locale, "footer.legal.legalNotice")}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openConsentPanel()}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {t(locale, "cookieConsent.footerLink")}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t(locale, "footer.contact.title")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:lazarefortune@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  lazarefortune@gmail.com
                </a>
              </li>
              <li>
                <Link
                  href="https://lazarefortune.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  lazarefortune.com
                </Link>
              </li>
            </ul>
          </div>

          {/* Language */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t(locale, "nav.language")}</h3>
            <div className="flex items-center">
              <LocaleSwitcher />
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground font-semibold">
          <p>
            © {new Date().getFullYear()} QuizLink · {t(locale, "footer.rights")} · {t(locale, "footer.createdBy")}{" "}
            <Link
              href="https://lazarefortune.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              Lazare Fortune
            </Link>
            {" · "}{t(locale, "footer.madeWith")}
          </p>
        </div>
      </div>
    </footer>
  );
}
