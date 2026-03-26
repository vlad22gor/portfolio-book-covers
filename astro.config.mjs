// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const repository = process.env.GITHUB_REPOSITORY;
const [owner, repo] = repository ? repository.split('/') : [undefined, undefined];
const isUserSite = Boolean(owner && repo && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`);
const base = process.env.CI && repo && !isUserSite ? `/${repo}/` : '/';
const site = process.env.PUBLIC_SITE_URL ?? (owner ? `https://${owner}.github.io${isUserSite ? '/' : base}` : undefined);

export default defineConfig({
  site,
  base,
  vite: {
    plugins: [tailwindcss()],
  },
});
