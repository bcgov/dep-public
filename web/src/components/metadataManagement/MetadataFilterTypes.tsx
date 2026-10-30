import { faObjectIntersect, faObjectUnion } from '@fortawesome/pro-regular-svg-icons';
import { MetadataFilterType } from './types';

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
