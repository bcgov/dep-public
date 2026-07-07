import React, { useMemo } from 'react';
import { SwipeableDrawer, IconButton, Stack, Grid2 as Grid, ThemeProvider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { MetadataFilterChip } from './MetadataFilterChip';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { useAppTranslation } from 'hooks';
import { Button } from 'components/common/Input/Button';
import { DarkTheme } from 'styles/Theme';
import { Heading2, Heading4 } from 'components/common/Typography';
import { FilterDrawerProps } from './types';

const FilterDrawer = (props: FilterDrawerProps) => {
    const { searchFilters, setSearchFilters, metadataFilters, clearFilters, filtersOpen, setFiltersOpen } = props;

    const { t: translate } = useAppTranslation();

    const selectedValue = useMemo(() => {
        return searchFilters.engagement_status.length > 0 ? searchFilters.engagement_status[0] : -1;
    }, [searchFilters.engagement_status]);

    const handleMetadataFilterClick = (taxonId: number, value: string) => {
        const existingFilter = searchFilters.metadata.find((filter) => filter.taxon_id === taxonId);
        let newValues;
        if (existingFilter) {
            // Toggle value in or out
            newValues = existingFilter.values.includes(value)
                ? existingFilter.values.filter((v) => v !== value)
                : [...existingFilter.values, value];
        } else {
            newValues = [value];
        }
        const metadataFilter = metadataFilters.find((f) => f.taxon_id === taxonId);
        const newMetadataFilters = searchFilters.metadata.filter((filter) => filter.taxon_id !== taxonId);
        if (newValues.length > 0 && metadataFilter) {
            newMetadataFilters.push({
                name: metadataFilter.name,
                values: newValues,
                filter_type: metadataFilter.filter_type,
                taxon_id: taxonId,
            });
        }

        setSearchFilters({ ...searchFilters, metadata: newMetadataFilters, page: 1 });
    };

    return (
        <ThemeProvider theme={DarkTheme}>
            <SwipeableDrawer
                aria-label="Filter Engagements"
                aria-expanded={filtersOpen}
                anchor="left"
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                    sx: { zIndex: 1300 }, // Cover the floating feedback button
                }}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: '100%', md: '50%' },
                            padding: '3em',
                            boxSizing: 'border-box',
                            borderRadius: '0 1rem 1rem 0',
                        },
                    },
                }}
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                onOpen={() => setFiltersOpen(true)}
            >
                <ThemeProvider theme={DarkTheme}>
                    <IconButton
                        onClick={() => setFiltersOpen(false)}
                        title={translate('landing.filters.aria.closeDrawer')}
                        sx={{
                            color: 'white',
                            position: 'absolute',
                            top: '1em',
                            right: '1em',
                            '&:focus-visible': {
                                outline: 'white 2px dashed',
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px', height: '20px', width: '20px' }} />
                    </IconButton>
                    <Heading2 mt={3} mb={6}>
                        {translate('landing.filters.drawer.title')}
                    </Heading2>
                    <Heading4 mt={3}>{translate('landing.filters.drawer.statusFilter')}</Heading4>
                    <Stack direction="row" sx={{ mb: 2, mt: 2.5 }} flexWrap="wrap">
                        {[
                            -1,
                            EngagementDisplayStatus.Open,
                            EngagementDisplayStatus.Upcoming,
                            EngagementDisplayStatus.Closed,
                        ].map((status) => (
                            <MetadataFilterChip
                                key={status}
                                name={(EngagementDisplayStatus[status] || 'All') + ' Engagements'}
                                selected={selectedValue == status}
                                onClick={() => {
                                    setSearchFilters({
                                        ...searchFilters,
                                        engagement_status: status === -1 ? [] : [status],
                                        page: 1,
                                    });
                                }}
                            />
                        ))}
                    </Stack>

                    {metadataFilters.map((metadataFilter) => (
                        <React.Fragment key={metadataFilter.taxon_id}>
                            <Heading4 mt={3}>
                                {translate('landing.filters.drawer.filterHeader').replace(
                                    '{0}',
                                    metadataFilter.name ?? 'metadata',
                                )}
                            </Heading4>
                            <Stack direction="row" sx={{ mb: 2, mt: 2.5 }} flexWrap="wrap">
                                {metadataFilter.values.map((value) => (
                                    <MetadataFilterChip
                                        key={`${metadataFilter.taxon_id}-${value}`}
                                        name={value}
                                        selected={searchFilters.metadata.some(
                                            (filter) =>
                                                filter.taxon_id === metadataFilter.taxon_id &&
                                                filter.values.includes(value),
                                        )}
                                        onClick={() => handleMetadataFilterClick(metadataFilter.taxon_id, value)}
                                    />
                                ))}
                            </Stack>
                        </React.Fragment>
                    ))}

                    <Grid size={12} container justifyContent="flex-start" alignItems="flex-end">
                        <Button
                            variant="primary"
                            aria-label={translate('landing.filters.aria.applyFilters')}
                            sx={{
                                mt: 4,
                                mr: 2,
                                width: '200px',
                                '&:focus-visible': {
                                    outline: 'white 2px dashed',
                                    outlineOffset: '2px',
                                },
                            }}
                            onClick={() => setFiltersOpen(false)}
                        >
                            {translate('landing.filters.drawer.apply')}
                        </Button>

                        <Button
                            variant="tertiary"
                            sx={{
                                mt: 2,
                                width: '200px',
                                color: 'white',
                                '&:hover,&:focus': {
                                    backgroundColor: 'blue.80',
                                },
                                '&:focus-visible': {
                                    outline: 'white 2px dashed',
                                    outlineOffset: '2px',
                                },
                            }}
                            onClick={clearFilters}
                            icon={<FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px' }} />}
                            iconPosition="right"
                        >
                            {translate('landing.filters.clear')}
                        </Button>
                    </Grid>
                </ThemeProvider>
            </SwipeableDrawer>
        </ThemeProvider>
    );
};

export default FilterDrawer;
