module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  env: {
    es6: true,
    node: true,
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal'],
        'newlines-between': 'always',
      },
    ],
  },
};
