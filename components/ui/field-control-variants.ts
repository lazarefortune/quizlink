/** Styles de champ partagés (Input, Textarea) — bordure Swan, focus vert, pas de ring */
export const fieldControlBaseClassName = [
  "w-full border-2 font-sans text-foreground outline-none transition-[border-color]",
  "placeholder:text-muted-foreground/50",
  "focus-visible:outline-none focus-visible:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
] as const;

export const fieldControlSurfaceClassName =
  "border-[hsl(var(--outline-button-border))] bg-secondary hover:border-[hsl(var(--outline-button-border-hover))] focus:border-primary disabled:bg-muted/60";

export const fieldControlElevatedClassName =
  "border-[hsl(var(--outline-button-border))] bg-card hover:border-[hsl(var(--outline-button-border-hover))] focus:border-primary disabled:bg-muted/40";

export const fieldControlVariantClassNames = {
  surface: fieldControlSurfaceClassName,
  elevated: fieldControlElevatedClassName,
} as const;

export type FieldControlVariant = keyof typeof fieldControlVariantClassNames;
