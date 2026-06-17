import Image from "next/image";

import { resolveCoinPackIconTier } from "@/lib/coins/resolveCoinPackIconTier";
import { cn } from "@/lib/utils";

type CoinPackCoinsIconProps = {
  coins: number;
  className?: string;
};

export const COINS_FACE_SRC = "/coins-face.png";
export const COINS_ONE_SRC = "/coins-one.png";
export const COINS_TWO_SRC = "/coins-two.png";
export const COINS_MULTIPLE_SRC = "/coins-multiple.svg";

const COIN_PACK_ICON_SIZE = 68;

function CoinPackAsset({
  src,
  testId,
  className,
}: {
  src: string;
  testId: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={COIN_PACK_ICON_SIZE}
      height={COIN_PACK_ICON_SIZE}
      aria-hidden
      className={cn("shrink-0 object-contain", className)}
      data-testid={testId}
    />
  );
}

export function CoinPackCoinsIcon({ coins, className }: CoinPackCoinsIconProps) {
  const tier = resolveCoinPackIconTier(coins);

  if (tier === "duo") {
    return (
      <CoinPackAsset
        src={COINS_TWO_SRC}
        testId="coin-pack-coins-icon-duo"
        className={className}
      />
    );
  }

  if (tier === "stacks" || tier === "stacksTall" || tier === "pile") {
    return (
      <CoinPackAsset
        src={COINS_MULTIPLE_SRC}
        testId="coin-pack-coins-icon-multiple"
        className={className}
      />
    );
  }

  return (
    <CoinPackAsset
      src={COINS_ONE_SRC}
      testId="coin-pack-coins-icon-single"
      className={className}
    />
  );
}
