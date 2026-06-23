import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { TenantState } from 'reduxSlices/tenantSlice';
import { useAppSelector } from './hooks';
import { useMatches } from 'react-router';
import { BreadcrumbProps, UIMatchWithCrumb } from 'components/common/Navigation/Breadcrumb';

const truncate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 1) + '…';
};

const DocumentTitle = () => {
    const tenant: TenantState = useAppSelector((state) => state.tenant);
    // Reverse list to prioritize the most specific route matches for title
    const matches = useMatches().reverse() as UIMatchWithCrumb[];
    const [pageTitle, setPageTitle] = React.useState(tenant.title);

    const getResolvedCrumbs = async (matches: UIMatchWithCrumb[]) => {
        return await Promise.all(
            matches.map(async (match) => {
                if (match.handle?.crumb) {
                    try {
                        const data = match.loaderData;
                        const resolvedCrumb = await match.handle.crumb(data);
                        return resolvedCrumb;
                    } catch {
                        return null;
                    }
                }
                return null;
            }),
        ).then((crumbs) => crumbs.filter((crumb): crumb is BreadcrumbProps => crumb !== null));
    };

    useEffect(() => {
        let cancelled = false;

        const resolveTitle = async () => {
            const crumbs = await getResolvedCrumbs(matches);
            if (cancelled) return;
            console.log('Resolved crumbs for title:', crumbs);
            const filteredCrumbs = crumbs
                // Exclude crumbs that are marked as index pages UNLESS they are the current page
                .filter((crumb, index) => (crumb?.title ?? crumb?.name) && (index == 0 || !crumb?.isIndex))
                .map((crumb) => truncate(crumb.title ?? crumb.name, 40)); // Limit individual crumb length to prevent excessively long titles
            if (filteredCrumbs.length < 1) {
                setPageTitle(tenant.title);
                return;
            }
            const title = filteredCrumbs.join(' | ');
            const truncatedTitle = truncate(title, 65); // Limit total title length to prevent browser truncation
            if (truncatedTitle == title) {
                setPageTitle(title + ' | ' + tenant.title);
            } else {
                setPageTitle(truncatedTitle + ' | ' + tenant.short_name.toUpperCase());
            }
        };

        resolveTitle();

        return () => {
            cancelled = true;
        };
    }, [matches, tenant.title, tenant.short_name]);

    return (
        <Helmet>
            <title>{pageTitle}</title>
        </Helmet>
    );
};

export default DocumentTitle;
