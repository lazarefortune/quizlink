export function shouldPinBuilderMobileTabsBar(
  anchorTopPx: number,
  scrollRootTopPx: number,
): boolean {
  return anchorTopPx < scrollRootTopPx - 0.5;
}
