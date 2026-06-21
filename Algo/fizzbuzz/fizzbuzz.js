const RULES = [
  { divisor: 3, label: 'Fizz' },
  { divisor: 5, label: 'Buzz' },
];

function fizzbuzz(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError('n must be a positive integer');
  }

  const result = [];

  for (let i = 1; i <= n; i++) {
    const line = RULES
      .filter((rule) => i % rule.divisor === 0)
      .map((rule) => rule.label)
      .join('');

    result.push(line || String(i));
  }

  return result;
}

module.exports = { fizzbuzz };
