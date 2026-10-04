import { describe, expect, it } from 'vitest';
import { mobileTabRoutes } from './components/mobile-tab-routes';

describe('mobile tab routes', () => {
  it('exposes the three primary destinations in a stable order', () => {
    expect(Object.values(mobileTabRoutes).map((route) => route.name)).toEqual([
      'index',
      'examples',
      'settings',
    ]);
  });

  it('keeps example details outside the bottom navigation', () => {
    expect(Object.values(mobileTabRoutes).map((route) => route.name)).not.toContain(
      'examples/[id]',
    );
  });
});
