function slugifyTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeTagsInput(input: string): string[] {
  const unique = new Set<string>();
  for (const raw of input.split(",")) {
    const slug = slugifyTag(raw);
    if (slug) {
      unique.add(slug);
    }
  }
  return [...unique];
}

export function normalizeTagList(tags: string[] | string | undefined): string[] {
  if (!tags) {
    return [];
  }
  const values = Array.isArray(tags) ? tags : tags.split(",");
  const unique = new Set<string>();
  for (const raw of values) {
    const slug = slugifyTag(raw);
    if (slug) {
      unique.add(slug);
    }
  }
  return [...unique];
}
