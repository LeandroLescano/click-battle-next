export const range = (start: number, end: number) => {
  return Array.from(
    Array.from(Array(Math.ceil((end - start) / 1)).keys()),
    (x) => start + x * 1
  );
};
