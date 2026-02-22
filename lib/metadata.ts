function escapeContextPart(value: string): string {
  return value.replace(/[|=]/g, " ").trim();
}

export function buildCloudinaryContext(fields: Record<string, string | undefined>): string {
  return Object.entries(fields)
    .map(([key, value]) => [key, escapeContextPart(value || "")] as const)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
}
