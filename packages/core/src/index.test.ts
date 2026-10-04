import { describe, expect, it } from 'vitest';
import { ApiError, parseExampleItem, parseExampleItems, type ExampleItem } from './index.js';

describe('example validation', () => {
  it('returns a complete example item', () => {
    const input: ExampleItem = { id: 'alpha', title: 'Alpha', summary: 'First item' };

    expect(parseExampleItem(input)).toEqual(input);
  });

  it('rejects an item with a missing title', () => {
    expect(() => parseExampleItem({ id: 'alpha', summary: 'First item' })).toThrowError(
      expect.objectContaining({ kind: 'invalid-response' }),
    );
  });

  it('rejects a non-array collection', () => {
    expect(() => parseExampleItems({ items: [] })).toThrowError(ApiError);
  });
});
