/**
 * Converts a string to a URL-friendly slug
 * Examples:
 * - "Citera's And World" -> "citeras-and-world"
 * - "My Repo!" -> "my-repo"
 * - "Test___Repo" -> "test-repo"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace apostrophes and quotes with nothing
    .replace(/['"]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Ensure it's not empty (fallback to 'repo' if empty)
    || 'repo';
}

/**
 * Generates a unique URL name by checking for duplicates and appending numbers
 * @param baseName The base name to convert to a slug
 * @param organizationId The organization ID (kept for consistency, not currently used)
 * @param existingUrlNames Array of existing URL names in the organization
 * @returns A unique URL name
 */
export function generateUniqueUrlName(
  baseName: string,
  organizationId: string,
  existingUrlNames: string[]
): string {
  const baseSlug = generateSlug(baseName);
  
  // Check if base slug is already taken
  if (!existingUrlNames.includes(baseSlug)) {
    return baseSlug;
  }
  
  // Find the highest number suffix
  let counter = 1;
  let candidate = `${baseSlug}-${counter}`;
  
  while (existingUrlNames.includes(candidate)) {
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
  
  return candidate;
}

