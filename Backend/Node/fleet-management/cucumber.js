module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['features/support/**/*.ts', 'features/step_definitions/**/*.ts'],
    paths: ['features/**/*.feature'],
    format: ['progress-bar'],
  },
  critical: {
    requireModule: ['ts-node/register'],
    require: ['features/support/**/*.ts', 'features/step_definitions/**/*.ts'],
    paths: ['features/**/*.feature'],
    tags: '@critical',
    format: ['progress-bar'],
  },
};
