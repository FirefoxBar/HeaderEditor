const { getESLintConfig } = require('@iceworks/spec');

// https://www.npmjs.com/package/@iceworks/spec
module.exports = getESLintConfig('react-ts', {
  rules: {
    'react/jsx-filename-extension': 0,
    'react/no-access-state-in-setstate': 0,
    '@typescript-eslint/member-ordering': 0,
    '@typescript-eslint/no-require-imports': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@iceworks/best-practices/recommend-polyfill': 0,
    '@iceworks/best-practices/no-js-in-ts-project': 0,
    '@iceworks/best-practices/recommend-functional-component': 0,
    'no-await-in-loop': 0,
    'no-console': 0,
    'no-prototype-builtins': 0,
    'no-return-assign': 0,
  },
});
