export const roundToNearestPowerOf2 = (value: number): number => {
  return Math.pow(2, Math.round(Math.log2(value)));
};
