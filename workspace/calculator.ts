/**
 * 2つの数値を加算します。
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 2つの数値を除算します。ゼロ除算の場合はエラーを投げます。
 */
export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero is not allowed.');
  }
  return a / b;
}
