/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  // Conventional types are fine; subjects can be casual lowercase.
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-empty': [0, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    // Allow "fix excel import for weird xlsx" without forcing Title Case
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [1, 'always', 120],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [1, 'always', 120],
  },
};
