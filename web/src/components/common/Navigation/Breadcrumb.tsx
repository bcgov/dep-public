import { Breadcrumbs, Skeleton } from '@mui/material';
import React, { Suspense, useEffect, useState } from 'react';
import { BodyText } from '../Typography';
import { Link } from '.';
import { Await, Params, UIMatch, useLocation, useMatches } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/pro-regular-svg-icons';

export type BreadcrumbProps = {
    name: string;
    link?: string;
    // If true, this crumb will be considered an index page for its parent and will not be used
    // when generating the page title, though the breadcrumb will still render unaffected.
    title?: string; // Optional custom title for document title generation, if different from the breadcrumb name
    isIndex?: boolean;
};

type BreadcrumbCache = Record<
    string,
    {
        breadcrumb: BreadcrumbProps | Promise<BreadcrumbProps>;
        loaderData: unknown;
    }
>;

/**
 * A component that displays a breadcrumb trail based on the provided crumbs.
 * Each crumb can be a link or plain text, and the last crumb is always displayed as plain text.
 * @param {Object} props - The properties for the breadcrumb trail component.
 * @param {Object[]} props.crumbs - An array of objects representing the breadcrumb items, each with a name and an optional link.
 * @param {boolean} [props.smallScreenOnly] - If true, the breadcrumbs will only be displayed on small screens.
 * @returns A JSX element representing the breadcrumb trail.
 * @example
 * <BreadcrumbTrail
 *     crumbs={[
 *         { name: 'Home', link: '/' },
 *         { name: 'Products', link: '/products' },
 *         { name: 'Electronics' } // Last crumb without a link
 *     ]}
 *     smallScreenOnly={true}
 * />
 */
export const BreadcrumbTrail: React.FC<{ crumbs: BreadcrumbProps[]; smallScreenOnly?: boolean }> = ({
    crumbs,
    smallScreenOnly,
}) => {
    return (
        <Breadcrumbs
            aria-label="breadcrumb"
            component="nav"
            sx={smallScreenOnly ? { display: { xs: 'block', md: 'none' } } : {}}
        >
            {crumbs.map((crumb, index) =>
                crumb.link ? (
                    <Link size="small" key={crumb.name} to={crumb.link} underline="hover">
                        {crumb.name}
                    </Link>
                ) : (
                    <BodyText
                        size="small"
                        bold={index == crumbs.length - 1}
                        key={crumb.name}
                        sx={{ lineHeight: '24px' }}
                    >
                        {crumb.name}
                    </BodyText>
                ),
            )}
        </Breadcrumbs>
    );
};

export type UICrumbFunction = (data: unknown, params?: Params<string>) => Promise<BreadcrumbProps> | BreadcrumbProps;

export interface UIRouteHandle {
    crumb?: UICrumbFunction;
    excludeFromTitle?: boolean; // If true, this route's crumb will be excluded from the document title generation
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UIMatchWithCrumb extends UIMatch<unknown, UIRouteHandle> {}

/**
 * Automatically generates breadcrumbs based on the `handle.crumb` function of the current route and its parents.
 * @param {Object} props - The properties for the AutoBreadcrumbs component.
 * @param {boolean} [props.smallScreenOnly] - If true, only displays the breadcrumbs on small screens.
 * @returns A list of breadcrumbs.
 */
export const AutoBreadcrumbs: React.FC<{ smallScreenOnly?: boolean }> = ({ smallScreenOnly }) => {
    const matches = (useMatches() as UIMatchWithCrumb[]).filter((match) => match.handle?.crumb);
    const routeKey = useLocation().key; // Use location key to force re-render when the route changes
    const [crumbCache, setCrumbCache] = useState<BreadcrumbCache>({});

    useEffect(() => {
        setCrumbCache((prevCache) => {
            const newCache: BreadcrumbCache = {};
            matches.forEach((match) => {
                if (match.handle?.crumb) {
                    const cachedCrumb = prevCache[match.pathname];
                    if (cachedCrumb && cachedCrumb.loaderData === match.loaderData) {
                        newCache[match.pathname] = cachedCrumb;
                    } else {
                        newCache[match.pathname] = {
                            breadcrumb: match.handle.crumb(match.loaderData, match.params),
                            loaderData: match.loaderData,
                        };
                    }
                }
            });
            return newCache;
        });
    }, [routeKey]); // Recompute only when matches change

    return (
        <Breadcrumbs
            aria-label="breadcrumbs"
            sx={{
                display: smallScreenOnly ? { xs: 'block', md: 'none' } : undefined,
                fontSize: '14px',
            }}
        >
            {matches.map((match, index) => (
                <Suspense
                    key={routeKey}
                    fallback={<Skeleton variant="text" width={100} height={24} sx={{ lineHeight: '24px' }} />}
                >
                    <Await key={match.pathname} resolve={crumbCache[match.pathname]?.breadcrumb}>
                        {(resolvedCrumb) => {
                            if (!resolvedCrumb) return null;
                            const name = resolvedCrumb?.name;
                            const link =
                                index < matches.length - 1 ? (resolvedCrumb?.link ?? match.pathname) : undefined;
                            const DisplayComponent = link ? Link : BodyText;
                            return (
                                <DisplayComponent
                                    size="small"
                                    bold={index === matches.length - 1 || undefined}
                                    key={match.pathname + name}
                                    to={link}
                                    sx={{
                                        display: 'inline-block',
                                        lineHeight: '24px',
                                        // Give the breadcrumbs a max width so that they don't overflow the
                                        // screen, but allow the current page to take up more space.
                                        maxWidth:
                                            index === matches.length - 1
                                                ? 'max(150px, calc(100vw - 2rem))'
                                                : 'max(150px, calc(50vw - 2rem))',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {index === 0 && <FontAwesomeIcon icon={faHome} style={{ marginRight: '4px' }} />}
                                    {name}
                                </DisplayComponent>
                            );
                        }}
                    </Await>
                </Suspense>
            ))}
        </Breadcrumbs>
    );
};
