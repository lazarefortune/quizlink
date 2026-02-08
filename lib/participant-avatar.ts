import { createAvatar } from "@dicebear/core";
import { micah } from "@dicebear/collection";

type Gender = "MALE" | "FEMALE" | "OTHER" | null;

/**
 * Generate a cute avatar SVG for a participant based on their gender
 * Uses DiceBear micah style with smile and no beard
 */
export function generateParticipantAvatar(
  participantId: string,
  gender: Gender
): string {
  const seed = participantId;

  const avatar = createAvatar(micah, {
    seed,
    facialHair: ["scruff"],
    facialHairProbability: 1,
    mouth: ["smile"],
    // hair depending on gender
    hair: gender === "MALE" ? ["fonze"] : ["full", "pixie"],
    hairColor: gender === "MALE" ? ["brown", "black"] : ["blonde", "brown"],
  });

  return avatar.toString();
}
