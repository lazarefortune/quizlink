import Link from "next/link";
import Image from "next/image";

import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 shrink-0 flex h-14 items-center border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg"
          aria-label="Retour à l'accueil"
        >
          <span className="text-lg font-bold text-foreground">
            <BrandQuizLinkText />
          </span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
