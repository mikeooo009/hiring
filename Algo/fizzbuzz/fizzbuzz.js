const RULES = [
  { divisor: 3, label: 'Fizz' },
  { divisor: 5, label: 'Buzz' },
];

function fizzbuzz(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError('n must be a positive integer');
  }

  const result = [];


  // Option 1
  // complexity: O(n x rules)
  for (let i = 1; i <= n; i++) {
    const line = RULES
      .filter((rule) => i % rule.divisor === 0)
      .map((rule) => rule.label)
      .join('');

    result.push(line || String(i));
  }
  
  
  // Option 2
  // complexity: O(n)
  //  for (let i = 1; i <= n; i++) {
   //   if (i % 3 === 0 && i % 5 === 0) {
   //     result.push('FizzBuzz');
   // } else if (i % 3 === 0) {
   //   result.push('Fizz');
   // } else if (i % 5 === 0) {
   //   result.push('Buzz');
   // } else {
   //   result.push(String(i));
   // }
  //}

  return result;
}

module.exports = { fizzbuzz };
