import { faObjectIntersect, faObjectUnion } from '@fortawesome/pro-regular-svg-icons';
import { MetadataFilterScope, MetadataFilterType } from './types';

export const MetadataFilterTypes: { [key: string]: MetadataFilterType } = {
    chips_any: {
        name: 'Match any selected option',
        code: 'chips_any',
        details: 'If someone selects more than one option, show engagements matching at least one of them.',
        icon: faObjectUnion,
    },
    chips_all: {
        name: 'Match all selected options',
        code: 'chips_all',
        details: 'If someone selects more than one option, show only engagements matching every selected option.',
        icon: faObjectIntersect,
    },
};

export const filterScopeLabels: Record<MetadataFilterScope, string> = {
    public: 'Public search',
    admin: 'Admin list',
    both: 'Public search and admin list',
};

export const isScopeEnabled = (
    taxon: { filter_type?: string | null; filter_scope?: MetadataFilterScope },
    scope: 'public' | 'admin',
) => {
    if (!taxon.filter_type) return false;
    const filterScope = taxon.filter_scope ?? 'public';
    return filterScope === 'both' || filterScope === scope;
};
