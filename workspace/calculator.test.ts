import { describe, it, expect } from 'vitest';
import { add, divide } from './calculator';

describe('calculator', () => {
  describe('add', () => {
    it('正の数同士を加算できること', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('負の数を含む加算ができること', () => {
      expect(add(-2, 3)).toBe(1);
      expect(add(-2, -3)).toBe(-5);
    });

    it('0を加算しても値が変わらないこと', () => {
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('divide', () => {
    it('正常に除算ができること', () => {
      expect(divide(6, 3)).toBe(2);
      expect(divide(5, 2)).toBe(2.5);
    });

    it('ゼロ除算の場合にエラーを投げること', () => {
      expect(() => divide(5, 0)).toThrow('Division by zero is not allowed.');
    });
  });
});
