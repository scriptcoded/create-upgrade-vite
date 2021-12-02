module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: [
    'import',
  ],
  extends: [
    'eslint:recommended',
    'standard',
  ],
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'import/order': ['error', {
      'newlines-between': 'always',
      pathGroups: [
        {
          pattern: '@/**',
          group: 'parent',
        },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
    }],
  },
}
