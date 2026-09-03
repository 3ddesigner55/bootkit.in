import type { RequestHandler } from 'express';

import type { HeaderNavigationItemInput } from '../services/headerNavigation.service';

const ALLOWED_SLUGS = [
  'beauty',
  'electronics',
  'pharmacy',
  'decor',
  'kids',
  'gifting',
] as const;

function validationError(message: string) {
  return Object.assign(new Error(message), {
    statusCode: 400,
  });
}

export const validateHeaderNavigationUpdateRequest: RequestHandler = (
  request,
  response,
  next,
) => {
  try {
    const items: unknown = request.body?.items;

    if (!Array.isArray(items)) {
      throw validationError('Header navigation items must be an array.');
    }

    if (items.length !== ALLOWED_SLUGS.length) {
      throw validationError(
        'All six header collections must be provided. Use active=false to hide one.',
      );
    }

    const seenSlugs = new Set<string>();

    const validatedItems: HeaderNavigationItemInput[] = items.map(
      (value, index) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          throw validationError(`Header item ${index + 1} is invalid.`);
        }

        const item = value as Record<string, unknown>;
        const slug =
          typeof item.slug === 'string'
            ? item.slug.trim().toLowerCase()
            : '';

        const label =
          typeof item.label === 'string'
            ? item.label.trim()
            : '';

        const icon =
          typeof item.icon === 'string'
            ? item.icon.trim()
            : '';

        if (
          !ALLOWED_SLUGS.includes(
            slug as (typeof ALLOWED_SLUGS)[number],
          )
        ) {
          throw validationError(`Invalid header collection: ${slug}.`);
        }

        if (seenSlugs.has(slug)) {
          throw validationError(
            `Duplicate header collection: ${slug}.`,
          );
        }

        if (!label || label.length > 40) {
          throw validationError(
            `Header label for ${slug} must contain 1–40 characters.`,
          );
        }

        if (!icon || icon.length > 500) {
          throw validationError(
            `A valid icon is required for ${slug}.`,
          );
        }

        if (typeof item.active !== 'boolean') {
          throw validationError(
            `Active status for ${slug} must be true or false.`,
          );
        }

        seenSlugs.add(slug);

        return {
          slug,
          label,
          icon,
          active: item.active,
          sortOrder: index + 1,
        };
      },
    );

    for (const slug of ALLOWED_SLUGS) {
      if (!seenSlugs.has(slug)) {
        throw validationError(
          `Missing header collection: ${slug}.`,
        );
      }
    }

    response.locals.headerNavigationItems = validatedItems;
    next();
  } catch (error) {
    next(error);
  }
};