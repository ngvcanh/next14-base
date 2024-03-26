export const numify = {
  swap(num1: number, num2: number) {
    num1 = num1 + num2;
    num2 = num1 - num2;
    num1 = num1 - num2;
    return [num1, num2];
  },
  is(value: number, compare: number) {
    return value === compare;
  },
  inRange(value: number, min: number, max: number) {
    if (min > max) {
      [min, max] = numify.swap(min, max);
    }
  
    return value > min && value < max;
  },
  inRangeLeft(value: number, min: number, max: number) {
    return numify.is(value, min) || numify.inRange(value, min, max);
  },
  inRangeRight(value: number, min: number, max: number) {
    return numify.is(value, max) || numify.inRange(value, min, max);
  },
  inRanges(value: number, min: number, max: number) {
    return numify.is(value, min) || numify.is(value, max) || numify.inRange(value, min, max);
  },
};
