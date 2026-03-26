import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.number(),
    project: z.string(),
    shortDescription: z.string(),
    featured: z.boolean().default(false),
    cover: z.object({
      thumb: z.string(),
      poster: z.string(),
    }),
    motion: z
      .object({
        poster: z.string(),
        webm: z.string().optional(),
        mp4: z.string().optional(),
      })
      .optional(),
    gallery: z.array(z.string()).default([]),
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
});

export const collections = { cases };
