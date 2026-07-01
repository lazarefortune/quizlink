"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleIcon } from "@/components/ui/google-icon";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Star,
  Zap,
  Trophy,
  BookOpen,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="mb-6 font-sans text-2xl font-extrabold text-foreground"
  >
    {children}
  </motion.h2>
);

const ColorSwatch = ({
  name,
  variable,
  className,
  variant = "bg",
  hint,
}: {
  name: string;
  variable: string;
  className: string;
  variant?: "bg" | "text" | "border";
  hint?: string;
}) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className={
        variant === "text"
          ? `flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-card font-sans text-2xl font-extrabold ${className}`
          : variant === "border"
            ? `h-16 w-16 rounded-2xl border-4 bg-card ${className}`
            : `h-16 w-16 rounded-2xl border-2 border-border ${className}`
      }
      aria-hidden={variant === "text"}
    >
      {variant === "text" ? "Aa" : null}
    </div>
    <span className="text-xs font-bold text-foreground">{name}</span>
    <span className="text-[10px] text-muted-foreground">{variable}</span>
    {hint ? (
      <span className="max-w-[7rem] text-center text-[10px] text-muted-foreground">{hint}</span>
    ) : null}
  </div>
);

export default function DesignSystemPage() {
  const { showToast } = useToast();
  const [collapsibleOpen, setCollapsibleOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Retour">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-sans text-xl font-extrabold text-foreground">
              Design System
            </h1>
            <p className="text-sm text-muted-foreground">
              <BrandQuizLinkText className="inline" /> UI Kit
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-16 px-4 py-10">
        {/* Design direction */}
        <section>
          <SectionTitle>Design direction</SectionTitle>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thème</CardTitle>
              <CardDescription>
                Dark mode : fond gris doux. Boutons : ombres bouncy, effet press
                au clic.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Couleurs */}
        <section>
          <SectionTitle>Couleurs</SectionTitle>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Palette principale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <CardDescription className="mb-4 font-bold">
                  Surfaces
                </CardDescription>
                <div className="flex flex-wrap gap-6">
                  <ColorSwatch
                    name="Background"
                    variable="--background"
                    className="bg-background"
                    hint="Polar"
                  />
                  <ColorSwatch
                    name="Card"
                    variable="--card"
                    className="bg-card"
                    hint="Snow"
                  />
                  <ColorSwatch
                    name="Secondary"
                    variable="--secondary"
                    className="bg-secondary"
                  />
                  <ColorSwatch
                    name="Muted"
                    variable="--muted"
                    className="bg-muted"
                  />
                  <ColorSwatch
                    name="Accent"
                    variable="--accent"
                    className="bg-accent"
                    hint="Swan"
                  />
                  <ColorSwatch
                    name="Border"
                    variable="--border"
                    variant="border"
                    className="border-border"
                    hint="Swan"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <CardDescription className="mb-4 font-bold">
                  Texte — neutres
                </CardDescription>
                <div className="flex flex-wrap gap-6">
                  <ColorSwatch
                    name="Foreground"
                    variable="--foreground"
                    variant="text"
                    className="text-foreground"
                    hint="Eel · text-foreground"
                  />
                  <ColorSwatch
                    name="Muted foreground"
                    variable="--muted-foreground"
                    variant="text"
                    className="text-muted-foreground"
                    hint="Wolf · text-muted-foreground"
                  />
                  <ColorSwatch
                    name="Primary"
                    variable="--primary"
                    className="bg-primary"
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Dark mode : <code className="rounded bg-muted px-1 font-mono text-xs">muted-foreground</code>{" "}
                  passe sur Hare (#AFAFAF).
                </p>
              </div>

              <Separator />

              <div>
                <CardDescription className="mb-4 font-bold">
                  Sémantiques
                </CardDescription>
                <div className="flex flex-wrap gap-6">
                  <ColorSwatch
                    name="Destructive"
                    variable="--destructive"
                    className="bg-destructive"
                  />
                  <ColorSwatch
                    name="Warning"
                    variable="--warning"
                    className="bg-warning"
                  />
                  <ColorSwatch
                    name="Highlight"
                    variable="--highlight"
                    className="bg-highlight"
                  />
                  <ColorSwatch
                    name="Blue"
                    variable="--blue"
                    className="bg-blue"
                    hint="#1CB0F6"
                  />
                  <ColorSwatch
                    name="Cobalt"
                    variable="--cobalt"
                    className="bg-cobalt"
                    hint="#2B70C9"
                  />
                  <ColorSwatch
                    name="Purple"
                    variable="--purple"
                    className="bg-purple"
                    hint="#CE82FF"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <CardDescription className="mb-4 font-bold">
                  Classes Tailwind
                </CardDescription>
                <div className="flex flex-wrap gap-3 text-sm">
                  {[
                    "text-foreground",
                    "text-muted-foreground",
                    "text-primary",
                    "text-blue",
                    "text-cobalt",
                    "text-purple",
                    "text-warning",
                    "text-highlight",
                    "border-border",
                    "bg-muted",
                    "bg-secondary",
                  ].map((className) => (
                    <code
                      key={className}
                      className="rounded-lg border border-border bg-muted px-2 py-1 font-mono text-xs text-foreground"
                    >
                      {className}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Typographie */}
        <section>
          <SectionTitle>Typographie</SectionTitle>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Font
                </span>
                <p className="mt-1 font-sans text-2xl font-extrabold text-foreground">
                  Fredoka — The quick brown fox
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="font-fredoka text-4xl font-extrabold text-foreground">
                  Heading 1
                </p>
                <p className="font-fredoka text-2xl font-bold text-foreground">
                  Heading 2
                </p>
                <p className="text-base text-foreground">
                  Body — texte de lecture.
                </p>
                <p className="text-sm text-muted-foreground">
                  Small — légendes.
                </p>
              </div>
              <Separator />
              <p className="text-gradient-fun text-2xl font-extrabold">
                Gradient
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Boutons */}
        <section>
          <SectionTitle>Boutons</SectionTitle>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variants</CardTitle>
              <CardDescription>
                Effet bouncy 3D sur les boutons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="blue">Blue</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link" asChild>
                  <a href="#couleurs">Link</a>
                </Button>
              </div>
              <Separator />
              <CardDescription className="font-bold">Tailles</CardDescription>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
                <Button size="icon" aria-label="Icône">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
              <Separator />
              <CardDescription className="font-bold">
                Outline — OAuth, actions secondaires
              </CardDescription>
              <Button variant="outline" size="lg" className="h-12 min-w-[min(100%,20rem)] gap-3 px-6 text-base font-semibold normal-case tracking-normal [&_svg]:!size-5">
                <GoogleIcon className="shrink-0" />
                Continuer avec Google
              </Button>
              <Separator />
              <Button variant="hero" size="xl">
                <Zap className="h-5 w-5" /> Commencer un quiz
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Formulaires */}
        <section>
          <SectionTitle>Formulaires</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="grid max-w-sm gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ds-input-surface">Surface (fond page)</Label>
                  <Input id="ds-input-surface" variant="surface" placeholder="Placeholder…" />
                </div>
                <div className="space-y-2 rounded-xl bg-primary/10 p-4">
                  <Label htmlFor="ds-input-elevated">Elevated (fond carte / coloré)</Label>
                  <Input id="ds-input-elevated" variant="elevated" placeholder="Placeholder…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-disabled">Désactivé</Label>
                  <Input id="ds-disabled" variant="surface" placeholder="Disabled" disabled />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="ds-check" />
                  <Label htmlFor="ds-check">
                    J&apos;accepte les conditions
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Textarea surface</Label>
                  <Textarea variant="surface" placeholder="Plusieurs lignes…" />
                </div>
                <div className="space-y-2 rounded-xl bg-primary/10 p-4">
                  <Label>Textarea elevated</Label>
                  <Textarea variant="elevated" placeholder="Sur fond coloré…" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Textarea */}
        <section>
          <SectionTitle>Textarea</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="grid max-w-md gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ds-textarea">Description</Label>
                  <Textarea
                    id="ds-textarea"
                    placeholder="Écris quelque chose ici…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-textarea-disabled">Désactivé</Label>
                  <Textarea
                    id="ds-textarea-disabled"
                    placeholder="Non modifiable"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <SectionTitle>Badges</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="bg-blue text-blue-foreground">Blue</Badge>
                <Badge className="bg-warning text-warning-foreground">
                  Warning
                </Badge>
                <Badge className="bg-purple text-purple-foreground">
                  Purple
                </Badge>
                <Badge className="bg-highlight text-highlight-foreground">
                  Highlight
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Avatar */}
        <section>
          <SectionTitle>Avatar</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center space-y-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
                      alt="Felix"
                    />
                    <AvatarFallback>FX</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-bold text-muted-foreground">
                    Image
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary font-extrabold text-lg text-primary-foreground">
                      QL
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-bold text-muted-foreground">
                    Fallback
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/adventurer/svg?seed=Luna"
                      alt="Luna"
                    />
                    <AvatarFallback>LN</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-bold text-muted-foreground">
                    Medium
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">ML</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-bold text-muted-foreground">
                    Small
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Accordion */}
        <section>
          <SectionTitle>Accordion</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-bold">
                    C&apos;est quoi <BrandQuizLinkText className="inline" /> ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Une plateforme pour créer et partager des quiz. Apprends en
                    t&apos;amusant.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-bold">
                    Comment créer un quiz ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Clique sur &quot;Créer un quiz&quot;, ajoute tes questions,
                    personnalise et partage le lien.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-bold">
                    Est-ce gratuit ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Oui, <BrandQuizLinkText className="inline" /> est gratuit. Crée autant de quiz que tu veux.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Collapsible */}
        <section>
          <SectionTitle>Collapsible</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Collapsible
                open={collapsibleOpen}
                onOpenChange={setCollapsibleOpen}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    3 catégories de quiz
                  </h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {collapsibleOpen ? "Masquer" : "Voir tout"}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <div className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground">
                  Culture générale
                </div>
                <CollapsibleContent className="space-y-2">
                  <div className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground">
                    Sciences
                  </div>
                  <div className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground">
                    Jeux vidéo
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <SectionTitle>Cards</SectionTitle>
          <div className="grid gap-6 md:grid-cols-3">
            <Card variant="raised">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  <CardTitle className="text-lg">Card raised</CardTitle>
                </div>
                <CardDescription>Bordure 3D statique</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <code className="rounded bg-muted px-1 font-mono text-xs">
                    variant=&quot;raised&quot;
                  </code>{" "}
                  — bordure fine + base épaisse, sans hover.
                </p>
              </CardContent>
            </Card>
            <Card variant="playful">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-highlight" />
                  <CardTitle className="text-lg">Card playful</CardTitle>
                </div>
                <CardDescription>Hover + lift</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <code className="rounded bg-muted px-1 font-mono text-xs">
                    variant=&quot;playful&quot;
                  </code>{" "}
                  — effet au survol (landing, communauté).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue" />
                  <CardTitle className="text-lg">Card standard</CardTitle>
                </div>
                <CardDescription>Sans effet playful</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Style par défaut, fond bg-card, bordure border-border.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alert */}
        <section>
          <SectionTitle>Alert</SectionTitle>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Alert variant="info" title="Info">
                Tu peux partager ton quiz avec un simple lien.
              </Alert>
              <Alert variant="error" title="Erreur">
                Oups, quelque chose s&apos;est mal passé. Réessaie.
              </Alert>
            </CardContent>
          </Card>
        </section>

        {/* Dialog (second example) */}
        <section>
          <SectionTitle>Dialog (exemple Bravo)</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="blue">Ouvrir le dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold">
                      Bravo !
                    </DialogTitle>
                    <DialogDescription>
                      Tu as terminé le quiz avec un score de 8/10.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center py-4">
                    <div className="text-6xl animate-bounce-in" aria-hidden>
                      🎊
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Voir les réponses</Button>
                    <Button variant="primary">Quiz suivant</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        {/* Breadcrumb */}
        <section>
          <SectionTitle>Breadcrumb</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">
                      <Home className="mr-1 inline h-4 w-4" />
                      Accueil
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Mes Quiz</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Culture générale</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </CardContent>
          </Card>
        </section>

        {/* Carousel */}
        <section>
          <SectionTitle>Carousel</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Carousel className="mx-auto w-full max-w-sm">
                <CarouselContent>
                  {[
                    {
                      emoji: "🧠",
                      title: "Culture générale",
                      color: "bg-primary/10",
                    },
                    { emoji: "🔬", title: "Sciences", color: "bg-blue/10" },
                    { emoji: "🎮", title: "Jeux vidéo", color: "bg-purple/10" },
                    {
                      emoji: "🌍",
                      title: "Géographie",
                      color: "bg-warning/10",
                    },
                    {
                      emoji: "📚",
                      title: "Histoire",
                      color: "bg-highlight/10",
                    },
                  ].map((item, index) => (
                    <CarouselItem key={index} className="basis-2/3">
                      <div className="p-1">
                        <Card
                          className={`border-2 border-border ${item.color}`}
                        >
                          <CardContent className="flex flex-col items-center justify-center p-6">
                            <span className="mb-2 text-4xl">{item.emoji}</span>
                            <span className="text-sm font-extrabold text-foreground">
                              {item.title}
                            </span>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        </section>

        {/* Table */}
        <section>
          <SectionTitle>Table</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>
                  Classement du quiz &quot;Culture générale&quot;
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rang</TableHead>
                    <TableHead>Joueur</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Temps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      rank: "🥇",
                      name: "Alice",
                      score: "10/10",
                      time: "1m 23s",
                    },
                    { rank: "🥈", name: "Bob", score: "9/10", time: "1m 45s" },
                    {
                      rank: "🥉",
                      name: "Charlie",
                      score: "8/10",
                      time: "2m 10s",
                    },
                    { rank: "4", name: "Diana", score: "7/10", time: "2m 30s" },
                    { rank: "5", name: "Eve", score: "6/10", time: "3m 05s" },
                  ].map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-bold">{row.rank}</TableCell>
                      <TableCell className="font-semibold">
                        {row.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.score === "10/10" ? "default" : "secondary"
                          }
                        >
                          {row.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Tabs */}
        <section>
          <SectionTitle>Tabs</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="tab1" className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tab1">Quiz</TabsTrigger>
                  <TabsTrigger value="tab2">Résultats</TabsTrigger>
                  <TabsTrigger value="tab3">Paramètres</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <p className="text-sm text-muted-foreground pt-2">
                    Contenu de l&apos;onglet Quiz.
                  </p>
                </TabsContent>
                <TabsContent value="tab2">
                  <p className="text-sm text-muted-foreground pt-2">
                    Contenu de l&apos;onglet Résultats.
                  </p>
                </TabsContent>
                <TabsContent value="tab3">
                  <p className="text-sm text-muted-foreground pt-2">
                    Contenu de l&apos;onglet Paramètres.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Ombres Bouncy */}
        <section>
          <SectionTitle>Ombres Bouncy</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                {[
                  {
                    label: "Default",
                    cls: "btn-bouncy bg-secondary text-foreground",
                  },
                  {
                    label: "Primary",
                    cls: "btn-bouncy-primary bg-primary text-primary-foreground",
                  },
                  {
                    label: "Blue",
                    cls: "btn-bouncy-blue bg-blue text-blue-foreground",
                  },
                  {
                    label: "Outline",
                    cls: "btn-bouncy-outline border-2 border-[hsl(var(--outline-button-border))] bg-card text-foreground",
                  },
                ].map((s) => (
                  <button
                    key={s.label}
                    className={`rounded-2xl px-6 py-3 text-sm font-extrabold ${s.cls}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Clique pour voir l&apos;effet press.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Animations */}
        <section>
          <SectionTitle>Animations</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-10">
                <div className="text-center">
                  <div className="animate-wiggle text-4xl" aria-hidden>
                    🦉
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    wiggle
                  </span>
                </div>
                <div className="text-center">
                  <div className="animate-float text-4xl" aria-hidden>
                    🎈
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    float
                  </span>
                </div>
                <div className="text-center">
                  <div className="animate-bounce-in text-4xl" aria-hidden>
                    ⭐
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    bounce-in
                  </span>
                </div>
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="inline-block cursor-pointer text-4xl"
                    aria-hidden
                  >
                    <Heart className="h-10 w-10 text-destructive" />
                  </motion.div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Framer Motion
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Border radius */}
        <section>
          <SectionTitle>Border radius</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                {[
                  { label: "sm", cls: "rounded-sm" },
                  { label: "md", cls: "rounded-md" },
                  { label: "lg", cls: "rounded-lg" },
                  { label: "xl", cls: "rounded-xl" },
                  { label: "2xl", cls: "rounded-2xl" },
                  { label: "full", cls: "rounded-full" },
                ].map((r) => (
                  <div key={r.label} className="text-center">
                    <div className={`h-16 w-16 bg-primary ${r.cls}`} />
                    <span className="mt-2 block text-xs font-bold text-muted-foreground">
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Toast */}
        <section>
          <SectionTitle>Toast</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Toasts en haut à droite. Clique pour déclencher.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => showToast("Succès !", "success")}
                >
                  Success
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => showToast("Erreur.", "error")}
                >
                  Error
                </Button>
                <Button
                  variant="blue"
                  onClick={() => showToast("Info.", "info")}
                >
                  Info
                </Button>
                <Button
                  variant="secondary"
                  className="border-warning/50 bg-warning/10 text-warning hover:bg-warning/20 dark:border-warning/40 dark:bg-warning/15 dark:hover:bg-warning/25"
                  onClick={() => showToast("Attention.", "warning")}
                >
                  Warning
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Switch */}
        <section>
          <SectionTitle>Switch</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center justify-between gap-4">
                  <Label>Notifications</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label>Activé par défaut</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label>Désactivé</Label>
                  <Switch disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Select */}
        <section>
          <SectionTitle>Select</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Select>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                  <SelectItem value="c">Option C</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </section>

        {/* Dialog */}
        <section>
          <SectionTitle>Dialog (modal)</SectionTitle>
          <Card>
            <CardContent className="pt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary">Ouvrir la modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Exemple de modal</DialogTitle>
                    <DialogDescription>
                      Contenu de la modal. Fermer avec ESC ou clic extérieur.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Tu peux mettre un formulaire ou du texte ici.
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="primary">Confirmer</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
