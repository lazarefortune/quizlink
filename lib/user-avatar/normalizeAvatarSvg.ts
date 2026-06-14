/** Ensures DiceBear SVGs scale correctly inside fixed-size containers. */
export function normalizeAvatarSvg(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/i, (_match, rawAttributes: string) => {
    const withoutDimensions = rawAttributes
      .replace(/\s(width|height)=["'][^"']*["']/gi, "")
      .trim();

    const hasPreserveAspectRatio = /preserveAspectRatio=/i.test(withoutDimensions);
    const attributes = hasPreserveAspectRatio
      ? withoutDimensions
      : `${withoutDimensions} preserveAspectRatio="xMidYMid meet"`.trim();

    return `<svg ${attributes}>`;
  });
}
