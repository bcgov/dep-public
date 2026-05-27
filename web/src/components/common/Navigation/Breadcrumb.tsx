import { Breadcrumbs } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { BodyText } from '../Typography';
import { Link } from '.';
import { UIMatch, useMatches } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/pro-regular-svg-icons';

type BreadcrumbProps = {
    name: string;
    link?: string;
};

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

type UICrumbFunction = (data: unknown) => Promise<BreadcrumbProps> | BreadcrumbProps;

interface UIRouteHandle {
    crumb?: UICrumbFunction;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UIMatchWithCrumb extends UIMatch<unknown, UIRouteHandle> {}

/**
 * Automatically generates breadcrumbs based on the `handle.crumb` function of the current route and its parents.
 * @param {Object} props - The properties for the AutoBreadcrumbs component.
 * @param {boolean} [props.smallScreenOnly] - If true, only displays the breadcrumbs on small screens.
 * @returns A list of breadcrumbs.
 */
export const AutoBreadcrumbs: React.FC<{ smallScreenOnly?: boolean }> = ({ smallScreenOnly }) => {
    const matches = (useMatches() as UIMatchWithCrumb[]).filter((match) => match.handle?.crumb);
    const matchKey = matches.map((m) => m.pathname).join('|');
    const [resolvedCrumbs, setResolvedCrumbs] = React.useState<Record<string, BreadcrumbProps>>({});

    const crumbs = useMemo(() => {
        return matches.map((match) => {
            const data = match.loaderData;
            const handle = match.handle;

            try {
                return handle?.crumb?.(data) ?? { name: '', link: '' };
            } catch {
                return { name: '', link: '' };
            }
        });
    }, [matchKey]); // Recompute only when matches change

    useEffect(() => {
        let cancelled = false;

        const setNewCrumbs = (
            resolvedCrumb: BreadcrumbProps,
            previousCrumbs: Record<string, BreadcrumbProps>,
            pathname: string,
        ) => {
            const previousCrumb = previousCrumbs[pathname];

            // Avoid unnecessary re-renders if the crumb did not actually change.
            if (previousCrumb?.name === resolvedCrumb?.name && previousCrumb?.link === resolvedCrumb?.link) {
                return previousCrumbs;
            }

            return {
                ...previousCrumbs,
                [pathname]: resolvedCrumb,
            };
        };

        crumbs.forEach(async (unresolvedCrumb, index) => {
            const pathname = matches[index]?.pathname;
            if (!pathname) return;

            const resolvedCrumb = await unresolvedCrumb;
            if (cancelled) return;
            setResolvedCrumbs((previousCrumbs) => setNewCrumbs(resolvedCrumb, previousCrumbs, pathname));
        });

        return () => {
            cancelled = true;
        };
    }, [crumbs, matches]);

    return (
        <Breadcrumbs
            aria-label="breadcrumbs"
            sx={{
                display: smallScreenOnly ? { xs: 'block', md: 'none' } : undefined,
                fontSize: '14px',
            }}
        >
            {matches.map((match, index) => {
                const resolvedCrumb = resolvedCrumbs[match.pathname];
                if (!resolvedCrumb) return null;
                const name = resolvedCrumb?.name;
                const link = index < matches.length - 1 ? (resolvedCrumb?.link ?? match.pathname) : undefined;

                return link ? (
                    <Link size="small" key={match.pathname + name} to={link} sx={{ lineHeight: '24px' }}>
                        {index === 0 && <FontAwesomeIcon icon={faHome} style={{ marginRight: '4px' }} />}
                        {name}
                    </Link>
                ) : (
                    <BodyText
                        size="small"
                        bold={index === matches.length - 1}
                        key={match.pathname + name}
                        sx={{ lineHeight: '24px' }}
                    >
                        {index === 0 && <FontAwesomeIcon icon={faHome} style={{ marginRight: '4px' }} />}
                        {name}
                    </BodyText>
                );
            })}
        </Breadcrumbs>
    );
};
