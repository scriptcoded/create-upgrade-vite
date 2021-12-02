module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: [
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
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
