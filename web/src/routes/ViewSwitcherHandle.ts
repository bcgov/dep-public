import { Params } from 'react-router';

/**
 * Type for a view switcher handler that can be added to a route's handle.
 * Routes define their own mapping between admin and public views.
 */
export type ViewSwitcherHandle = (
    loaderData: unknown,
    params: Params<string>,
    currentLanguageId: string,
) => Promise<{ label: string; href: string } | null>;
