import type { Variants } from "framer-motion";

/** Stagger + entrée pour la colonne formulaire des pages auth */
export const authFormContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0,
    },
  },
};

export const authFormItemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/** Stagger + entrée (léger rebond) pour les panneaux latéraux auth */
export const authPanelContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Stagger plus marqué pour la page inscription (titres + 3 blocs s’affichent un par un) */
export const authPanelSignupContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.12,
    },
  },
};

export const authPanelItemVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

/** Keyframes + linear = vitesse constante, pas de ralentissement en haut/bas */
const noEaseAtExtremes = "linear" as const;

/** Flottement vertical (icône) — plusieurs keyframes + linear pour éviter le ralentissement au sommet */
export const panelIconFloat = {
  y: [0, -5.5, -11, -16.5, -22, -16.5, -11, -5.5, 0],
  transition: {
    repeat: Infinity,
    duration: 2.5,
    ease: noEaseAtExtremes,
  },
};

/** Dérive forme 1 (bulle) — idem, mouvement régulier */
export const panelShapeDrift1 = {
  x: [0, 8, 16, 24, 32, 24, 16, 8, 0],
  y: [0, -6, -12, -18, -24, -18, -12, -6, 0],
  transition: {
    repeat: Infinity,
    duration: 5,
    ease: noEaseAtExtremes,
  },
};

/** Dérive forme 2 (bulle) */
export const panelShapeDrift2 = {
  x: [0, -7, -14, -21, -28, -21, -14, -7, 0],
  y: [0, 7.5, 15, 22.5, 30, 22.5, 15, 7.5, 0],
  transition: {
    repeat: Infinity,
    duration: 6,
    ease: noEaseAtExtremes,
  },
};

/** Rotation (carré) */
export const panelShapeRotate = {
  rotate: [0, 360],
  transition: { duration: 12, repeat: Infinity, ease: noEaseAtExtremes },
};

/** Pulse scale — keyframes + linear pour pas de pause aux extrêmes */
export const panelShapePulse = {
  scale: [1, 1.04, 1.08, 1.12, 1.15, 1.12, 1.08, 1.04, 1],
  transition: {
    repeat: Infinity,
    duration: 2.5,
    ease: noEaseAtExtremes,
  },
};
