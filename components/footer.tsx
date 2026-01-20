"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
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

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t(locale, "footer.legal.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(locale, "footer.legal.legalNotice")}
                </Link>
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

        </div>

        {/* Bottom */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} QuizLink. {t(locale, "footer.rights")}.{" "}
            {t(locale, "footer.createdBy")}{" "}
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
    </footer>
  );
}
