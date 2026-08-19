import { describe, it, expect } from 'vitest';
import { sanitizeEthiopianPhone } from './helpers';

describe('sanitizeEthiopianPhone', () => {
  describe('valid numbers', () => {
    it('keeps a complete local number', () => {
      expect(sanitizeEthiopianPhone('0912345678')).toBe('0912345678');
    });

    it('keeps a complete international number', () => {
      expect(sanitizeEthiopianPhone('+251912345678')).toBe('+251912345678');
    });

    it('allows build-up of a local prefix', () => {
      expect(sanitizeEthiopianPhone('0')).toBe('0');
      expect(sanitizeEthiopianPhone('09')).toBe('09');
      expect(sanitizeEthiopianPhone('0912')).toBe('0912');
    });

    it('allows build-up of an international prefix', () => {
      expect(sanitizeEthiopianPhone('+')).toBe('+');
      expect(sanitizeEthiopianPhone('+25')).toBe('+25');
      expect(sanitizeEthiopianPhone('+2519')).toBe('+2519');
      expect(sanitizeEthiopianPhone('+251912')).toBe('+251912');
    });
  });

  describe('length caps', () => {
    it('blocks the extra digit on a local number', () => {
      expect(sanitizeEthiopianPhone('09123456789')).toBe('0912345678');
    });

    it('blocks the extra digit on an international number', () => {
      expect(sanitizeEthiopianPhone('+2519123456789')).toBe('+251912345678');
    });

    it('caps a pasted oversized local number', () => {
      expect(sanitizeEthiopianPhone('09123456789', '')).toBe('0912345678');
    });

    it('caps a pasted oversized international number', () => {
      expect(sanitizeEthiopianPhone('+2519123456789', '')).toBe('+251912345678');
    });
  });

  describe('invalid prefixes', () => {
    it('rejects an 08 prefix', () => {
      expect(sanitizeEthiopianPhone('0812345678', '')).toBe('0');
    });

    it('rejects an 07 prefix', () => {
      expect(sanitizeEthiopianPhone('0712345678', '')).toBe('0');
    });

    it('rejects a +2518 prefix', () => {
      expect(sanitizeEthiopianPhone('+251812345678', '')).toBe('+251');
    });

    it('rejects a plain digits-only international number without the plus', () => {
      expect(sanitizeEthiopianPhone('251912345678', '')).toBe('');
    });
  });

  describe('letters and symbols', () => {
    it('strips letters from a local number', () => {
      expect(sanitizeEthiopianPhone('09123abc78', '')).toBe('0912378');
    });

    it('strips symbols like spaces, dashes and parentheses', () => {
      expect(sanitizeEthiopianPhone('+251 912-345-678', '')).toBe('+251912345678');
      expect(sanitizeEthiopianPhone('(09)1234-5678', '')).toBe('0912345678');
    });

    it('only allows the plus as the first character', () => {
      expect(sanitizeEthiopianPhone('0912+3456', '')).toBe('09123456');
      expect(sanitizeEthiopianPhone('+2519', '')).toBe('+2519');
    });
  });

  describe('deletion and correction', () => {
    it('keeps the value while backspacing', () => {
      expect(sanitizeEthiopianPhone('091234567', '0912345678')).toBe('091234567');
    });

    it('allows correction from an in-progress number', () => {
      expect(sanitizeEthiopianPhone('0912', '09123')).toBe('0912');
    });
  });

  describe('empty input', () => {
    it('keeps empty input empty', () => {
      expect(sanitizeEthiopianPhone('')).toBe('');
      expect(sanitizeEthiopianPhone('abc', '')).toBe('');
      expect(sanitizeEthiopianPhone('+', '')).toBe('+');
    });
  });
});