const TAB_CONTENT_HEIGHT = 68;
const CAPSULE_SAFE_AREA_GAP = 8;

export function getGlassTabIndicatorOffset(index: number, width: number, count: number) {
  if (count <= 0) return 0;

  const safeIndex = Math.max(0, Math.min(index, count - 1));
  return (Math.max(0, width) / count) * safeIndex;
}

export function getGlassTabBarLayout(bottomInset: number) {
  const safeAreaBottom = Math.max(0, bottomInset);

  return {
    barHeight: TAB_CONTENT_HEIGHT + safeAreaBottom,
    capsuleTop: 4,
    capsuleBottom: safeAreaBottom + CAPSULE_SAFE_AREA_GAP,
    contentBottomPadding: TAB_CONTENT_HEIGHT + 20,
  };
}
