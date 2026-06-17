import {
  AVATAR_BACKGROUND_COLORS,
  BIG_EARS_CHEEK_VARIANTS,
  BIG_EARS_EAR_VARIANTS,
  BIG_EARS_EYES_VARIANTS,
  BIG_EARS_FACE_VARIANTS,
  BIG_EARS_FRONT_HAIR_VARIANTS,
  BIG_EARS_HAIR_COLORS,
  BIG_EARS_HAIR_VARIANTS,
  BIG_EARS_MOUTH_VARIANTS,
  BIG_EARS_NOSE_VARIANTS,
  BIG_EARS_SIDEBURN_VARIANTS,
  BIG_EARS_SKIN_COLORS,
} from "./bigEarsOptionValues";
import type { UserAvatarOptions } from "./userAvatarConfigSchema";

function pickRandom<T>(values: readonly T[]): T {
  const index = Math.floor(Math.random() * values.length);
  return values[index] as T;
}

function pickRandomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

export function createRandomUserAvatarOptions(): UserAvatarOptions {
  const options: UserAvatarOptions = {
    hair: [pickRandom(BIG_EARS_HAIR_VARIANTS)],
    face: [pickRandom(BIG_EARS_FACE_VARIANTS)],
    mouth: [pickRandom(BIG_EARS_MOUTH_VARIANTS)],
    ear: [pickRandom(BIG_EARS_EAR_VARIANTS)],
    eyes: [pickRandom(BIG_EARS_EYES_VARIANTS)],
    nose: [pickRandom(BIG_EARS_NOSE_VARIANTS)],
    skinColor: [pickRandom(BIG_EARS_SKIN_COLORS)],
    hairColor: [pickRandom(BIG_EARS_HAIR_COLORS)],
  };

  if (pickRandomBoolean()) {
    options.sideburn = [];
  } else {
    options.sideburn = [pickRandom(BIG_EARS_SIDEBURN_VARIANTS)];
  }

  if (pickRandomBoolean()) {
    options.frontHair = [];
  } else {
    options.frontHair = [pickRandom(BIG_EARS_FRONT_HAIR_VARIANTS)];
  }

  if (pickRandomBoolean(0.4)) {
    options.cheekProbability = 0;
  } else {
    options.cheek = [pickRandom(BIG_EARS_CHEEK_VARIANTS)];
    options.cheekProbability = 100;
  }

  return options;
}

export function createRandomUserAvatarBackgroundColor(): string {
  return pickRandom(AVATAR_BACKGROUND_COLORS);
}
