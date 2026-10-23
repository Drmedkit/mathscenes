import { describe, expect, it } from 'vitest';
import { leadValue, lastNumber } from '../src/lesson/runtime/explain';

describe('runtime explain: reading numbers from steps', () => {
  it('reads every thousands group', () => {
    expect(leadValue('7,400,000 people')?.v).toBe(7400000);
    expect(leadValue('$1,234,567.89')?.v).toBe(1234567.89);
    expect(lastNumber('so the total is 12,345,678.')).toBe(12345678);
  });
  it('keeps a list of numbers apart', () => {
    expect(lastNumber('2, 4, 6, 8')).toBe(8);
    expect(leadValue('1,450 m')?.v).toBe(1450);
  });
});
