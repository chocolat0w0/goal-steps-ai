import { describe, it, expect } from 'vitest';

describe('テスト環境', () => {
  it('基本的なテストが動作すること', () => {
    expect(1 + 1).toBe(2);
  });

  it('配列操作のテスト', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('オブジェクト操作のテスト', () => {
    const obj = { name: 'テスト', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('テスト');
  });
});