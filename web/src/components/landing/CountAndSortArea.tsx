import React, { useContext, useEffect, useState } from 'react';
import { LandingDataContext } from './index';
import { BodyText } from 'components/common/Typography';
import Grid from '@mui/material/Grid2';
import { Select } from 'components/common/Input/Select';
import { updateSearchParams } from './utils';
import { Box, SelectChangeEvent } from '@mui/material';
import { SortOrder } from './types';
import { useAppTranslation } from 'hooks';

const CountAndSortArea = () => {
    const { searchParams, engagements: engs } = useContext(LandingDataContext);
    const [engCount, setEngCount] = useState(0);
    const [sort, setSort] = useState('engagement.created_date:desc');

    useEffect(() => {
        const sortKey = searchParams.get('sort_key');
        const sortOrder = searchParams.get('sort_order');

        if (sortKey && sortOrder) {
            setSort(`${sortKey}:${sortOrder}`);
        }
    }, [searchParams]);

    useEffect(() => {
        const retrieveEngagementCount = async () => {
            const engPage = await engs;
            setEngCount(engPage?.total ?? engCount);
        };
        retrieveEngagementCount();
    }, [engs]);

    return (
        <Grid
            container
            flexDirection={{ xs: 'column', md: 'row' }}
            flexWrap={{ xs: 'wrap', md: 'nowrap' }}
            justifyContent={{ xs: 'flex-start', md: 'space-between' }}
            alignItems={{ xs: 'flex-start', md: 'space-between' }}
            rowSpacing={'10px'}
            p={0}
            m="0 0 2rem"
            border={0}
            size={12}
        >
            <EngagementResultsCount engCount={engCount} />
            <SortSelect sort={sort} />
        </Grid>
    );
};

export const EngagementResultsCount = ({ engCount }: { engCount: number }) => {
    const { t: translate } = useAppTranslation();
    return (
        <BodyText m="auto 0" sx={{ '& .MuiGrid2-root': { height: '100%' } }}>
            <Box component="span" fontWeight="bold">
                {engCount}
            </Box>
            <Box component="span">
                {` 
                    ${translate('landing.filters.countEngagement')}${engCount > 1 || engCount === 0 ? 's' : ''} 
                    ${translate('landing.filters.countFound')}
                `}
            </Box>
        </BodyText>
    );
};

const SortSelect = ({ sort }: { sort: string }) => {
    if (!sort) return;
    const { t: translate } = useAppTranslation();
    const sortOptions = [
        { value: 'engagement.created_date:asc', label: translate('landing.filters.sort.oldestCreated') },
        { value: 'engagement.created_date:desc', label: translate('landing.filters.sort.newestCreated') },
        { value: 'engagement.updated_date:asc', label: translate('landing.filters.sort.oldestUpdated') },
        { value: 'engagement.updated_date:desc', label: translate('landing.filters.sort.newestUpdated') },
    ];
    const { searchParams, setSearchParams } = useContext(LandingDataContext);

    const updateSort = (event: SelectChangeEvent<unknown>) => {
        const newString = String(event.target.value);
        if (!newString || !newString.includes(':')) return;
        const [key, order] = newString.split(':');
        if (!key || !order) return;
        setSearchParams(updateSearchParams({ sort_key: key, sort_order: order as SortOrder }, searchParams));
    };

    return (
        <Grid container spacing={1.5} alignItems="center" sx={{ height: '50px', mb: 'auto' }}>
            <BodyText
                sx={{
                    display: 'flex',
                }}
            >
                {translate('landing.filters.sortBy')}
            </BodyText>
            <Select
                id="sort-select"
                sx={{
                    height: '2.5rem',
                    width: '12.5rem',
                }}
                value={sort}
                options={sortOptions}
                renderValue={() => (
                    <BodyText color="text.primary">{sortOptions.find((so) => so.value === sort)?.label}</BodyText>
                )}
                onChange={(event) => updateSort(event)}
            ></Select>
        </Grid>
    );
};

export default CountAndSortArea;
