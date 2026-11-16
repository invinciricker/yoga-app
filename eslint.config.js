// The lint rules: Expo's standard set. Run with: npm run lint
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'dist-site/*', '.expo/*', 'node_modules/*'] },
]);
