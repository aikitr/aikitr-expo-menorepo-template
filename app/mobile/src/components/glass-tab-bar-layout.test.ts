import { describe, expect, it } from 'vitest';
import * as glassTabBarLayout from './glass-tab-bar-layout';
import { getGlassTabBarLayout } from './glass-tab-bar-layout';

const getGlassTabIndicatorOffset = Reflect.get(glassTabBarLayout, 'getGlassTabIndicatorOffset') as
  ((index: number, width: number, count: number) => number) | undefined;

describe('getGlassTabBarLayout', () => {
  it('calculates the horizontal target for the selected menu slider', () => {
    expect(getGlassTabIndicatorOffset).toBeTypeOf('function');
    expect(getGlassTabIndicatorOffset?.(2, 360, 3)).toBe(240);
  });

  it('keeps the glass capsule above the system safe area and reserves scroll space', () => {
    expect(getGlassTabBarLayout(34)).toEqual({
      barHeight: 102,
      capsuleTop: 4,
      capsuleBottom: 42,
      contentBottomPadding: 88,
    });
  });

  it('supports devices without a bottom safe-area inset', () => {
    expect(getGlassTabBarLayout(0)).toEqual({
      barHeight: 68,
      capsuleTop: 4,
      capsuleBottom: 8,
      contentBottomPadding: 88,
    });
  });
});
