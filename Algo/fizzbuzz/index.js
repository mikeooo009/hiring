const { fizzbuzz } = require('./fizzbuzz');

const n = Number(process.argv[2] ?? 100);

if (!Number.isInteger(n) || n < 1) {
  console.error('Usage: npm start -- <positive integer>');
  process.exit(1);
}

fizzbuzz(n).forEach((line) => console.log(line));
