import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Stack, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DeletableFilterChip } from './DeletableFilterChip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { faSliders } from '@fortawesome/pro-regular-svg-icons/faSliders';
import { MetadataFilter } from 'components/metadataManagement/types';
import { debounce } from 'lodash';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { useAppTranslation } from 'hooks';
import { Button } from 'components/common/Input/Button';
import { colors } from '../common';
import { CustomTextField, Select } from 'components/common/Input';
import { When } from 'react-if';
import { BodyText } from 'components/common/Typography/Body';
import { FilterBlockProps } from './types';

const FilterBlock = (props: FilterBlockProps) => {
    const { searchFilters, setSearchFilters, clearFilters, setFiltersOpen } = props;
    const selectedValue = searchFilters.engagement_status.length === 0 ? -1 : searchFilters.engagement_status[0];

    const tileBlockRef = useRef<HTMLDivElement>(null);
    const [didMount, setDidMount] = useState(false);

    const theme = useTheme();
    const { t: translate } = useAppTranslation();

    const selectableStatuses: Map<number, string> = new Map([
        [EngagementDisplayStatus.Open, translate('landing.filters.status.open')],
        [EngagementDisplayStatus.Upcoming, translate('landing.filters.status.upcoming')],
        [EngagementDisplayStatus.Closed, translate('landing.filters.status.closed')],
        [-1, translate('landing.filters.status.all')],
    ]);

    const debounceSetSearchFilters = useRef(
        debounce((searchText: string) => {
            setSearchFilters({
                ...searchFilters,
                search_text: searchText,
            });
        }, 300),
    ).current;

    useEffect(() => {
        setDidMount(true);
        return () => setDidMount(false);
    }, []);

    useEffect(() => {
        if (didMount) {
            const yOffset = tileBlockRef?.current?.offsetTop;
            globalThis.scrollTo({ top: yOffset || 0, behavior: 'smooth' });
        }
    }, [searchFilters.page]);

    const [searchText, setSearchText] = useState('');

    const handleDeleteFilterChip = (taxonId: number, value: string) => {
        const newMetadataFilters = searchFilters.metadata
            .map((filter: MetadataFilter) => {
                if (filter.taxon_id === taxonId) {
                    // Remove the value
                    const newValues = filter.values.filter((v) => v !== value);
                    return { ...filter, values: newValues };
                }
                return filter;
            })
            .filter((filter: MetadataFilter) => filter.values.length > 0); // Remove any filters with no values left

        setSearchFilters({ ...searchFilters, metadata: newMetadataFilters, page: 1 });
    };

    return (
        <Grid container size={12} justifyContent="flex-start" alignItems="flex-start" rowSpacing={3} pb="2rem">
            <Grid
                container
                size={12}
                justifyContent="flex-start"
                alignItems="flex-end"
                columnSpacing={2}
                rowSpacing={4}
                marginTop="2em"
                sx={{ padding: 0, flexWrap: 'nowrap', flexDirection: 'row' }}
                ref={tileBlockRef}
            >
                <Grid width="100%">
                    <BodyText bold pb="0.25em">
                        {translate('landing.filters.search')}
                    </BodyText>
                    <CustomTextField
                        aria-label="Search box for filtering engagements. Search by title or select filters to narrow results automatically."
                        tabIndex={0}
                        fullWidth
                        placeholder={translate('landing.filters.searchPlaceholder')}
                        value={searchText}
                        sx={{ width: '100%' }}
                        onChange={(event) => {
                            setSearchText(event.target.value);
                            debounceSetSearchFilters(event.target.value);
                        }}
                        slotProps={{
                            input: {
                                sx: { height: 48, width: '100%' },
                                startAdornment: (
                                    <FontAwesomeIcon
                                        icon={faMagnifyingGlass}
                                        style={{
                                            fontSize: '20px',
                                            color: theme.palette.primary.main,
                                            marginRight: '5px',
                                        }}
                                    />
                                ),
                                endAdornment: searchText ? (
                                    <IconButton
                                        aria-label="clear search"
                                        title="Clear search"
                                        sx={{ color: '#9F9D9C' }}
                                        onClick={() => {
                                            setSearchFilters({
                                                ...searchFilters,
                                                search_text: '',
                                            });
                                            setSearchText('');
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                                    </IconButton>
                                ) : undefined,
                            },
                        }}
                    />
                </Grid>
                <Grid
                    size={{ xs: 12, sm: 3, md: 2, lg: 2, xl: 1 }}
                    container
                    justifyContent="flex-start"
                    alignItems="flex-start"
                >
                    <Button
                        fullWidth
                        aria-label={translate('landing.filters.aria.openDrawer')}
                        variant="primary"
                        icon={<FontAwesomeIcon icon={faSliders} style={{ fontSize: '18px' }} />}
                        onClick={() => setFiltersOpen(true)}
                    >
                        {translate('landing.filters.drawer.openButton')}
                    </Button>
                </Grid>
            </Grid>
            <Grid size={12} container justifyContent="flex-start" alignItems="flex-start">
                <Stack
                    direction="row"
                    sx={{ mb: 2 }}
                    flexWrap="wrap"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    gap={2}
                    rowGap={1}
                    width="100%"
                >
                    <Select
                        style={{ margin: 0 }}
                        value={selectedValue}
                        id="status-filter"
                        aria-label={`Filtering by ${selectableStatuses.get(
                            selectedValue,
                        )}. Change this filter value by expanding to view all options.`}
                        onChange={(event) => {
                            const selectedValue = Number(event.target.value);
                            setSearchFilters({
                                ...searchFilters,
                                engagement_status: selectedValue === -1 ? [] : [selectedValue],
                                page: 1,
                            });
                        }}
                        renderValue={(value) => selectableStatuses.get(value as number) ?? ''}
                        displayEmpty
                        inputProps={{
                            'aria-label': `Status Filter - ${selectableStatuses.get(selectedValue) ?? ''}`,
                        }}
                        options={Array.from(selectableStatuses).map(([status, label]) => ({
                            value: status,
                            label: label,
                        }))}
                    />
                    {searchFilters.metadata.map((filter: MetadataFilter) =>
                        filter.values.map((value) => (
                            <DeletableFilterChip
                                key={`${filter.taxon_id}-${value}`}
                                name={value}
                                onDelete={() => handleDeleteFilterChip(filter.taxon_id, value)}
                            />
                        )),
                    )}
                    <When condition={searchFilters.engagement_status.length || searchFilters.metadata.length}>
                        <Button
                            variant="tertiary"
                            onClick={clearFilters}
                            sx={{
                                fontWeight: 'normal',
                                height: 48,
                                fontSize: '15px',
                                borderRadius: '2em',
                                p: 2,
                                '&:focus, &:focus-visible': {
                                    backgroundColor: `${colors.focus.regular.inner}`,
                                    boxShadow: `0 0 0 2px white, 0 0 0 4px ${colors.focus.regular.outer}`,
                                },
                            }}
                            endIcon={<FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px' }} />}
                        >
                            {translate('landing.filters.clear')}
                        </Button>
                    </When>
                </Stack>
            </Grid>
        </Grid>
    );
};

export default FilterBlock;
