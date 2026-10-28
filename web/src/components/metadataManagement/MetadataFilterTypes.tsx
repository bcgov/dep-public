import { faObjectIntersect, faObjectUnion } from '@fortawesome/pro-regular-svg-icons';
import { MetadataFilterType } from './types';

export const MetadataFilterTypes: { [key: string]: MetadataFilterType } = {
    chips_any: {
        name: 'Show results matching any selected',
        code: 'chips_any',
        details:
            'Users may filter by selecting one or more values. At least one of the selected values must be present on the engagement for it to be shown.',
        icon: faObjectUnion,
    },
    chips_all: {
        name: 'Show results matching all selected',
        code: 'chips_all',
        details:
            'Users may filter by selecting one or more values. All the selected values must be present on the engagement for it to be shown.',
        icon: faObjectIntersect,
    },
};
