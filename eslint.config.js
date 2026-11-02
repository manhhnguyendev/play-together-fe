// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'src/api/generated/*'],
  },
  {
    // Every screen navigates through useAppRouter: it drops a repeat push of a
    // screen that is still on its way in, which is what stops burst taps from
    // stacking copies of one screen.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-router',
              importNames: ['useRouter'],
              message:
                "Use useAppRouter from '@/hooks/useAppRouter' instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // The wrapper itself is the one place allowed to reach for useRouter.
    files: ['src/hooks/useAppRouter.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
