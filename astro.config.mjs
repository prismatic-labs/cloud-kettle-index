// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://prismatic-labs.github.io',
  base: '/cloud-kettle-index',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});