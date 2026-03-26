import { getCollection } from 'astro:content';

export async function getCases() {
  const cases = await getCollection('cases');

  return cases.sort((a, b) => {
    if (a.data.featured && !b.data.featured) {
      return -1;
    }

    if (!a.data.featured && b.data.featured) {
      return 1;
    }

    return b.data.year - a.data.year;
  });
}

export async function getCaseBySlug(slug: string) {
  const cases = await getCollection('cases');
  return cases.find((entry) => entry.data.slug === slug);
}
