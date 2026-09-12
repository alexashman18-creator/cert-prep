const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.expo/**', 'agent-tools/**'],
  },
  {
    rules: {
      // SQLite repositories are the source of truth; screens load on mount.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
