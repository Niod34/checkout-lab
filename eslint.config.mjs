import next from 'eslint-config-next';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['.next/**', 'data/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts'],
  },
  ...next,
  ...nextTypescript,
  {
    files: ['tests/**/*.ts'],
    rules: {
      // O `use` das fixtures do Playwright é confundido com o hook `use` do React.
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];

export default config;
