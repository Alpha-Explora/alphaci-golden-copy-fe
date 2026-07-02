const {
  countLines,
  detectMojibake,
  classifyGlobalSelector,
  extractCssSelectors,
  createFileSizeReport,
  classifyGlobalSelectorDetailed,
  compareBaselineItems,
} = require('../../scripts/design-system/lib/report-helpers.cjs');

describe('design-system report helpers', () => {
  test('countLines handles empty, single-line, and multi-line text', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('one')).toBe(1);
    expect(countLines('one\ntwo\n')).toBe(2);
  });

  test('detectMojibake reports common corrupted characters with indexes', () => {
    expect(detectMojibake('clean text')).toEqual([]);
    const marker = String.fromCharCode(0xe2);
    expect(detectMojibake(`bad ${marker} text`)).toEqual([
      { index: 4, value: marker, reason: 'common mojibake marker' },
    ]);
  });


  test('detectMojibake caps hits when requested', () => {
    const marker = String.fromCharCode(0xe2);
    expect(detectMojibake(marker.repeat(3), { maxHits: 2 })).toEqual([
      { index: 0, value: marker, reason: 'common mojibake marker' },
      { index: 1, value: marker, reason: 'common mojibake marker' },
    ]);
  });
  test('classifyGlobalSelector separates allowed, primitive, feature, and unknown selectors', () => {
    expect(classifyGlobalSelector(':root')).toBe('global allowed');
    expect(classifyGlobalSelector('.skip-link')).toBe('global allowed');
    expect(classifyGlobalSelector('.button')).toBe('primitive-owned');
    expect(classifyGlobalSelector('.public-site-nav')).toBe('feature-owned');
    expect(classifyGlobalSelector('.raw-hero-actions')).toBe('feature-owned');
    expect(classifyGlobalSelector('.surprise-selector')).toBe('legacy-frozen');
  });


  test('classifyGlobalSelectorDetailed includes reason and owner', () => {
    expect(classifyGlobalSelectorDetailed('.public-site-nav')).toEqual({
      ownership: 'feature-owned',
      owner: 'public-site',
      reason: 'matches feature selector prefix',
    });
    expect(classifyGlobalSelectorDetailed('.button')).toEqual({
      ownership: 'primitive-owned',
      owner: 'button',
      reason: 'matches primitive selector prefix',
    });
  });

  test('compareBaselineItems reports new and resolved keys', () => {
    const result = compareBaselineItems(
      [{ key: 'a' }, { key: 'b' }],
      [{ key: 'b' }, { key: 'c' }],
      (item) => item.key,
    );

    expect(result.newItems).toEqual([{ key: 'c' }]);
    expect(result.resolvedItems).toEqual([{ key: 'a' }]);
    expect(result.unchangedItems).toEqual([{ key: 'b' }]);
  });
  test('extractCssSelectors ignores at-rules and keeps comma-separated selectors', () => {
    const css = '@media (min-width: 800px) { .a, .b:hover { color: red; } }\n:root { --x: 1; }';
    expect(extractCssSelectors(css)).toEqual(['.a', '.b:hover', ':root']);
  });


  test('extractCssSelectors ignores keyframe bodies', () => {
    const css = '@keyframes pulse { from { opacity: 0; } 50% { opacity: .5; } to { opacity: 1; } }\n.x, .y:hover { color: red; }';
    expect(extractCssSelectors(css)).toEqual(['.x', '.y:hover']);
  });
  test('createFileSizeReport marks files above their budget', () => {
    const report = createFileSizeReport([
      { path: 'src/app/globals.css', lines: 900 },
      { path: 'src/app/page.tsx', lines: 499 },
      { path: 'src/components/product/workflow-current-tab.tsx', lines: 1200 },
    ]);

    expect(report.overBudget.map((item) => item.path)).toEqual([
      'src/app/globals.css',
      'src/components/product/workflow-current-tab.tsx',
    ]);
    expect(report.redFlags.map((item) => item.path)).toEqual([]);
  });
});