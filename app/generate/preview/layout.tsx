import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Générer un Quiz avec l'IA | QuizLink",
  description: "Créez un quiz à partir de votre contenu (texte ou PDF) en utilisant l'intelligence artificielle. Générez automatiquement des questions à choix multiples, vrai/faux ou à cases à cocher.",
  keywords: ["quiz", "génération IA", "créer quiz", "PDF", "texte", "questions automatiques"],
  openGraph: {
    title: "Générer un Quiz avec l'IA | QuizLink",
    description: "Créez un quiz à partir de votre contenu en utilisant l'intelligence artificielle.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Générer un Quiz avec l'IA | QuizLink",
    description: "Créez un quiz à partir de votre contenu en utilisant l'intelligence artificielle.",
  },
};

export default function GeneratePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
