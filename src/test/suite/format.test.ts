import * as assert from 'assert';

import { formatarData, formatarSaldo } from '../../format';

suite('format', () => {
  suite('formatarSaldo', () => {
    test('formats with the US dollar symbol and dot decimal', () => {
      assert.strictEqual(formatarSaldo(10.25), '$10.25');
    });

    test('formats an integer with two decimal places', () => {
      assert.strictEqual(formatarSaldo(0), '$0.00');
    });

    test('formats with a thousands separator', () => {
      assert.strictEqual(formatarSaldo(1234.5), '$1,234.50');
    });

    test('formats values with many decimals by rounding', () => {
      assert.strictEqual(formatarSaldo(1.005), '$1.01');
    });
  });

  suite('formatarData', () => {
    test('formats YYYY-MM-DD as mm/dd/yyyy', () => {
      assert.strictEqual(formatarData('2026-09-05'), '09/05/2026');
    });

    test('formats a full ISO date', () => {
      const resultado = formatarData('2026-09-05T14:21:00.000Z');
      assert.match(resultado, /\d{2}\/\d{2}\/\d{4}/);
    });

    test('returns the original input for an invalid date', () => {
      assert.strictEqual(formatarData('not-a-date'), 'not-a-date');
    });
  });
});
