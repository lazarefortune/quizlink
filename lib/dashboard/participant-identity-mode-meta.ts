import type { ComponentType } from "react";

import {
  ParticipantIdentityAnonymousIcon,
  ParticipantIdentityNameEmailIcon,
  ParticipantIdentityPseudonymIcon,
} from "@/components/dashboard/participant-identity-mode-icons";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

export type ParticipantIdentityModePlayfulColors = {
  softCssVar: string;
  solidCssVar: string;
};

export type ParticipantIdentityModeOptionMeta = {
  mode: ParticipantIdentityMode;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
  descriptionKey: string;
  shortDescriptionKey: string;
  playfulColors: ParticipantIdentityModePlayfulColors;
  /** Optional extra line shown in UI for "full" variant. */
  privacyKey?: string;
};

export const PARTICIPANT_IDENTITY_MODE_OPTIONS: ParticipantIdentityModeOptionMeta[] = [
  {
    mode: "ANONYMOUS",
    icon: ParticipantIdentityAnonymousIcon,
    labelKey: "participantMode.anonymous.label",
    descriptionKey: "participantMode.anonymous.description",
    shortDescriptionKey: "participantMode.anonymous.shortDescription",
    playfulColors: {
      softCssVar: "--participant-mode-anonymous-soft",
      solidCssVar: "--participant-mode-anonymous-solid",
    },
  },
  {
    mode: "PSEUDONYM",
    icon: ParticipantIdentityPseudonymIcon,
    labelKey: "participantMode.pseudonym.label",
    descriptionKey: "participantMode.pseudonym.description",
    shortDescriptionKey: "participantMode.pseudonym.shortDescription",
    playfulColors: {
      softCssVar: "--participant-mode-pseudonym-soft",
      solidCssVar: "--participant-mode-pseudonym-solid",
    },
  },
  {
    mode: "NAME_EMAIL",
    icon: ParticipantIdentityNameEmailIcon,
    labelKey: "participantMode.nameEmail.label",
    descriptionKey: "participantMode.nameEmail.description",
    shortDescriptionKey: "participantMode.nameEmail.shortDescription",
    playfulColors: {
      softCssVar: "--participant-mode-name-email-soft",
      solidCssVar: "--participant-mode-name-email-solid",
    },
    privacyKey: "participantMode.nameEmail.privacy",
  },
];

export function getParticipantIdentityModeOption(
  mode: ParticipantIdentityMode,
): ParticipantIdentityModeOptionMeta {
  const option = PARTICIPANT_IDENTITY_MODE_OPTIONS.find((entry) => entry.mode === mode);
  if (!option) {
    return PARTICIPANT_IDENTITY_MODE_OPTIONS[0];
  }
  return option;
}
