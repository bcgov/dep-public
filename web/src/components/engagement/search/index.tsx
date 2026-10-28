import React, { Suspense } from 'react';
import { BodyText, Heading1, Heading2, Heading3 } from 'components/common/Typography';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    FormControlLabel,
    FormGroup,
    Grid2 as Grid,
    LinearProgress,
    Radio,
    RadioGroup,
    Skeleton,
} from '@mui/material';
import { Layout } from 'styles/Theme';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { TextInput } from 'components/common/Input/TextInput';
import { Button } from 'components/common/Input/Button';
import { Pagination } from 'components/common/Input/Pagination';
import { Link } from 'components/common/Navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useNavigate, useLocation, useLoaderData, useNavigation, Await } from 'react-router';
import {
    EngagementSearchLoaderData,
    metadataParam,
    metadataParamValues,
    metadataCountKey,
} from './engagementSearchLoader';
import { MetadataFilter } from 'components/metadataManagement/types';
import EngagementTile from 'engagements/EngagementTile';
import { ContentTag } from './ContentTag';
import { EngagementSearchFilterContext, useEngagementSearchFilterContext } from './EngagementSearchFilterContext';
import { TileSkeleton } from 'engagements/TileSkeleton';
import { useAppTranslation } from 'hooks';

const statusLabels = (translate: (key: string) => string) => [
    ['open', translate('search.statusFilter.open')],
    ['upcoming', translate('search.statusFilter.upcoming')],
    ['closed', translate('search.statusFilter.closed')],
    ['closedWithResults', translate('search.statusFilter.closedWithResults')],
];

const clearedSearchFilters = (searchParams: string, filters: MetadataFilter[]) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.delete('status');
    filters.forEach((filter) => {
        nextParams.delete(metadataParam(filter.taxon_id, filters));
        nextParams.delete(`meta-${filter.taxon_id}`);
    });
    nextParams.delete('region');
    Array.from(nextParams.keys())
        .filter((key) => /^(?:meta-)/.test(key))
        .forEach((key) => nextParams.delete(key));
    nextParams.delete('page');
    return nextParams;
};

export const EngagementSearch = () => {
    const location = useLocation();
    const queryParams = location.search;
    const navigation = useNavigation();
    const loaderData = useLoaderData() as EngagementSearchLoaderData;
    const { t: translate } = useAppTranslation();
    const [searchTerm, setSearchTerm] = React.useState(loaderData.q);
    const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
    const [showFilterFade, setShowFilterFade] = React.useState(false);
    const filterDialogContentRef = React.useRef<HTMLDivElement>(null);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [nextFilterState, setNextFilterState] = React.useState(queryParams);
    const [settledEngagements, setSettledEngagements] = React.useState<
        EngagementSearchLoaderData['engagements'] | null
    >(null);
    const [totalResults, setTotalResults] = React.useState<number | null>(null);

    React.useEffect(() => {
        let active = true;
        loaderData.engagements.then(
            // Executes when the promise resolves successfully
            (results) => {
                if (active) {
                    setSettledEngagements(loaderData.engagements);
                    setTotalResults(results.total);
                    setSearchLoading(false);
                }
            },
            // Executes when the promise is rejected
            () => {
                if (active) {
                    setSettledEngagements(loaderData.engagements);
                    setSearchLoading(false);
                }
            },
        );
        return () => {
            active = false;
        };
    }, [loaderData.engagements]);

    const isSearchNavigation =
        navigation.state !== 'idle' && (!navigation.location || navigation.location.pathname === location.pathname);
    const isSearchLoading = isSearchNavigation || settledEngagements !== loaderData.engagements;

    const navigate = useNavigate();

    const updateFilterFade = React.useCallback(() => {
        const content = filterDialogContentRef.current;
        const hasMoreContent =
            content !== null &&
            content.scrollHeight > content.clientHeight + 1 &&
            content.scrollTop + content.clientHeight < content.scrollHeight - 1;
        setShowFilterFade((current) => (current === hasMoreContent ? current : hasMoreContent));
    }, []);

    React.useEffect(() => {
        setNextFilterState(queryParams);
    }, [queryParams]);

    React.useEffect(() => {
        if (!filterMenuOpen) {
            setShowFilterFade(false);
            return;
        }

        const content = filterDialogContentRef.current;
        if (!content) {
            return;
        }

        updateFilterFade();
        const resizeObserver = new ResizeObserver(updateFilterFade);
        resizeObserver.observe(content);
        Array.from(content.children).forEach((child) => resizeObserver.observe(child));

        return () => resizeObserver.disconnect();
    }, [filterMenuOpen, updateFilterFade]);

    const setQueryParams = React.useCallback(
        (newQueryParams: URLSearchParams) => {
            const nextSearch = `?${newQueryParams.toString()}`;
            setNextFilterState(nextSearch);
            setSearchLoading(true);
            navigate('./' + nextSearch);
        },
        [navigate],
    );

    const searchFilterContextValue = React.useMemo(
        () => ({ nextFilterState, updateFilterState: setQueryParams }),
        [nextFilterState, setQueryParams],
    );

    const handleSearch = () => {
        const newQueryParams = new URLSearchParams(nextFilterState);
        newQueryParams.delete('page');
        if (searchTerm) {
            newQueryParams.set('q', searchTerm);
        } else {
            newQueryParams.delete('q');
        }
        setQueryParams(newQueryParams);
    };

    const handleClearFilters = (filters: MetadataFilter[]) => {
        setSearchTerm('');
        setQueryParams(clearedSearchFilters(nextFilterState, filters));
    };

    return (
        <EngagementSearchFilterContext.Provider value={searchFilterContextValue}>
            <Grid container size={12} justifyContent="center" spacing={3} px={Layout.padding.default}>
                <Grid container size={12} maxWidth={Layout.width.default}>
                    <Grid size={12} pt={4}>
                        <AutoBreadcrumbs />
                    </Grid>
                    {/* Desktop: Sort and filter menu */}
                    <Grid container size={3.5} display={{ xs: 'none', md: 'flex' }} alignContent="flex-start">
                        <BodyText component="h2" bold lineHeight="28px" mt={3}>
                            {translate('search.sortAndFilter')}
                        </BodyText>
                        <FilterMenu />
                    </Grid>
                    {/* Mobile: Sort and filter dialog */}
                    <Dialog
                        id="search-filter-dialog"
                        open={filterMenuOpen}
                        aria-labelledby="search-filter-dialog-title"
                        onClose={() => setFilterMenuOpen(false)}
                        sx={{ display: { xs: 'block', md: 'none' } }}
                        slotProps={{ paper: { sx: { minWidth: 'min(343px, 100vw)', borderRadius: '24px' } } }}
                    >
                        <DialogContent
                            ref={filterDialogContentRef}
                            onScroll={updateFilterFade}
                            sx={{
                                pb: 0,
                                // Fade out the bottom of the content if the filter menu is scrollable and not fully scrolled
                                maskImage: showFilterFade
                                    ? 'linear-gradient(to bottom, #000 calc(100% - 32px), transparent 100%)'
                                    : 'none',
                            }}
                        >
                            <Grid container size={12}>
                                <Grid size="grow">
                                    <BodyText
                                        id="search-filter-dialog-title"
                                        component="h2"
                                        bold
                                        lineHeight="28px"
                                        mb={3}
                                        py="2px"
                                    >
                                        {translate('search.sortAndFilter')}
                                    </BodyText>
                                </Grid>
                                <Grid size="auto">
                                    <Button
                                        sx={{ width: '32px', height: '32px', minWidth: 0 }}
                                        size="small"
                                        variant="tertiary"
                                        icon={<FontAwesomeIcon icon={faTimes} />}
                                        aria-label={translate('search.aria.closeFilterDialog')}
                                        onClick={() => setFilterMenuOpen(false)}
                                    />
                                </Grid>
                            </Grid>
                            <FilterMenu defaultExpanded={false} showExpandAll />
                        </DialogContent>
                        <DialogActions sx={{ flexDirection: 'column', alignItems: 'flex-start', p: 3, gap: 3 }}>
                            <Suspense
                                fallback={
                                    <>
                                        <Button sx={{ display: 'block' }} variant="primary" loading>
                                            {translate('search.applyFilters').replace('{0}', '…')}
                                        </Button>
                                        <Link
                                            component="button"
                                            type="button"
                                            aria-disabled="true"
                                            sx={{ ml: 2, color: 'gray.90' }}
                                            underline="none"
                                        >
                                            {translate('search.clear')}
                                        </Link>
                                    </>
                                }
                            >
                                <Await resolve={loaderData.engagements}>
                                    {(engagements) => (
                                        <Button
                                            sx={{ display: 'block' }}
                                            loading={searchLoading || isSearchLoading}
                                            onClick={() => setFilterMenuOpen(false)}
                                            variant="primary"
                                        >
                                            {translate('search.applyFilters').replace(
                                                '{0}',
                                                engagements?.total.toString(),
                                            )}
                                        </Button>
                                    )}
                                </Await>
                                <Await resolve={loaderData.metadataFilters}>
                                    {(filters) => (
                                        <Link
                                            component="button"
                                            type="button"
                                            onClick={() => handleClearFilters(filters)}
                                            sx={{ ml: 2 }}
                                        >
                                            {translate('search.clear')}
                                        </Link>
                                    )}
                                </Await>
                            </Suspense>
                        </DialogActions>
                    </Dialog>
                    {/* Engagement search results column */}
                    <Grid container size={{ xs: 12, md: 8.5 }} direction="column">
                        <Grid size={12}>
                            <Heading1 mb={1}>{translate('search.sectionHeading')}</Heading1>
                        </Grid>
                        {/* Search bar and search button */}
                        <Grid
                            container
                            size={12}
                            component="form"
                            role="search"
                            aria-label={translate('search.aria.searchForm')}
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSearch();
                            }}
                        >
                            <Grid container size="grow" justifyContent="flex-start">
                                <TextInput
                                    value={searchTerm}
                                    onChange={(value) => setSearchTerm(value)}
                                    inputProps={{ 'aria-label': translate('search.aria.queryInput') }}
                                    sx={{ height: '40px', borderColor: 'gray.80', width: '100%' }}
                                    startAdornment={<FontAwesomeIcon style={{ fontSize: '18px' }} icon={faSearch} />}
                                    placeholder={translate('search.queryPlaceholder')}
                                />
                            </Grid>
                            <Grid container size="auto">
                                <Button type="submit" variant="primary" size="small">
                                    {translate('search.searchAction')}
                                </Button>
                            </Grid>
                        </Grid>
                        <SelectedFilterTags metadataFilters={loaderData.metadataFilters} onClear={handleClearFilters} />
                        {/* Mobile sort and filter button */}
                        <Grid size={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                            <Button
                                size="small"
                                aria-haspopup="dialog"
                                aria-expanded={filterMenuOpen}
                                aria-controls="search-filter-dialog"
                                onClick={() => setFilterMenuOpen(true)}
                            >
                                {translate('search.sortAndFilter')}
                            </Button>
                        </Grid>
                        {/* Search results heading */}
                        <Grid container alignItems="baseline" size={12} gap={0}>
                            <Heading2 id="search-results-heading" decorated>
                                {translate('search.resultsHeading')}
                            </Heading2>{' '}
                            {(searchLoading || isSearchLoading) && (
                                <LinearProgress
                                    aria-label={translate('search.aria.loadingResults')}
                                    aria-valuetext={translate('search.aria.loadingResults')}
                                    sx={{ width: '100%', mt: -1, mb: -1 }}
                                />
                            )}
                        </Grid>
                        {/* Engagement results or no results message */}
                        <Grid
                            container
                            size={12}
                            direction="column"
                            aria-label={translate('search.resultsHeading')}
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                            aria-busy={searchLoading || isSearchLoading}
                        >
                            <Suspense fallback={<BodyText>{translate('search.aria.loadingResults')}</BodyText>}>
                                <Await
                                    key={String(searchLoading) + String(isSearchLoading)}
                                    resolve={loaderData.engagements}
                                >
                                    {(engagements) => {
                                        if (!engagements.total)
                                            return (
                                                <>
                                                    <Heading3>{translate('search.noResults.heading')}</Heading3>
                                                    <BodyText>
                                                        {translate('search.noResults.suggestionsIntro')}
                                                    </BodyText>
                                                    <ul style={{ paddingInlineStart: '2.5ch', margin: 0 }}>
                                                        <li>{translate('search.noResults.suggestion1')}</li>
                                                        <li>{translate('search.noResults.suggestion2')}</li>
                                                        <li>{translate('search.noResults.suggestion3')}</li>
                                                        <li>
                                                            <Link to="." onClick={() => setSearchTerm('')}>
                                                                {translate('search.noResults.browseAll')}
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </>
                                            );
                                        const message =
                                            engagements?.total === 1
                                                ? translate('search.foundSingle')
                                                : translate('search.foundMultiple');
                                        const [firstPart, secondPart] = message.split('{0}');
                                        return (
                                            <BodyText>
                                                {firstPart}
                                                <b>{engagements?.total || 0}</b>
                                                {secondPart}
                                            </BodyText>
                                        );
                                    }}
                                </Await>
                            </Suspense>
                        </Grid>
                        {/* Engagement results */}
                        <Grid
                            container
                            size={12}
                            direction="column"
                            role="region"
                            aria-labelledby="search-results-heading"
                            aria-busy={searchLoading || isSearchLoading}
                        >
                            {searchLoading || isSearchLoading ? (
                                <SearchResultsLoading />
                            ) : (
                                <Suspense fallback={<SearchResultsLoading />}>
                                    <Await resolve={loaderData.engagements}>
                                        {(engagementpage) => {
                                            return engagementpage.items.map((engagement) => (
                                                <EngagementTile
                                                    key={engagement.id}
                                                    orientation={{ xs: 'vertical', md: 'horizontal' }}
                                                    passedEngagement={engagement}
                                                    engagementId={engagement.id}
                                                />
                                            ));
                                        }}
                                    </Await>
                                </Suspense>
                            )}
                        </Grid>
                        {totalResults !== null && totalResults > 0 && (
                            <Pagination
                                ariaLabel={translate('common.paginationNavigation')}
                                page={Math.max(1, Number(new URLSearchParams(nextFilterState).get('page') ?? 1) || 1)}
                                count={Math.ceil(totalResults / 6)}
                                onChange={(_, nextPage) => {
                                    const params = new URLSearchParams(nextFilterState);
                                    params.set('page', String(nextPage));
                                    setQueryParams(params);
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </EngagementSearchFilterContext.Provider>
    );
};

const SelectedFilterTags = ({
    metadataFilters,
    onClear,
}: {
    metadataFilters: Promise<MetadataFilter[]>;
    onClear: (filters: MetadataFilter[]) => void;
}) => {
    const { nextFilterState, updateFilterState } = useEngagementSearchFilterContext();
    const { t: translate } = useAppTranslation();
    const params = new URLSearchParams(nextFilterState);
    const selectedStatuses = params.getAll('status');
    if (
        selectedStatuses.length === 0 &&
        !params.has('region') &&
        !Array.from(params.keys()).some((key) => /^(?:meta-)/.test(key))
    ) {
        return <Grid height="28px" my={1} />;
    }

    const removeStatus = (status: string) => {
        const nextParams = new URLSearchParams(nextFilterState);
        const remaining = nextParams.getAll('status').filter((item) => item !== status);
        nextParams.delete('status');
        remaining.forEach((item) => nextParams.append('status', item));
        nextParams.delete('page');
        updateFilterState(nextParams);
    };
    const removeMetadata = (taxonId: number, value: string, filters: MetadataFilter[]) => {
        const nextParams = new URLSearchParams(nextFilterState);
        const key = metadataParam(taxonId, filters);
        const remaining = metadataParamValues(nextParams, taxonId, filters).filter((item) => item !== value);
        nextParams.delete(key);
        nextParams.delete(`meta-${taxonId}`);
        if (
            filters
                .find((filter) => filter.taxon_id === taxonId)
                ?.name?.trim()
                .toLowerCase() === 'region'
        ) {
            nextParams.delete('region');
        }
        remaining.forEach((item) => nextParams.append(key, item));
        nextParams.delete('page');
        updateFilterState(nextParams);
    };
    return (
        <Grid
            container
            size={12}
            role="group"
            aria-label={translate('search.aria.appliedFilters')}
            alignItems="center"
            gap={1}
            my={1}
            minHeight="28px"
        >
            {selectedStatuses.map((status) => (
                <ContentTag
                    key={`status-${status}`}
                    label={
                        <BodyText lineHeight="22px" size="small" sx={{ color: 'inherit' }}>
                            <b>{translate('search.statusFilter.categoryName')}:</b>{' '}
                            {statusLabels(translate).find(([value]) => value === status)?.[1] ?? status}
                        </BodyText>
                    }
                    ariaLabel={translate('search.aria.deleteFilterChip').replace(
                        '{0}',
                        `${translate('search.statusFilter.categoryName')}: ${
                            statusLabels(translate).find(([value]) => value === status)?.[1] ?? status
                        }`,
                    )}
                    onDelete={() => removeStatus(status)}
                />
            ))}
            <Suspense fallback={null}>
                <Await resolve={metadataFilters} errorElement={null}>
                    {(filters: MetadataFilter[]) => (
                        <>
                            {filters.flatMap((filter) =>
                                metadataParamValues(params, filter.taxon_id, filters).map((value) => (
                                    <ContentTag
                                        key={`metadata-${filter.taxon_id}-${value}`}
                                        label={
                                            <BodyText lineHeight="22px" size="small" sx={{ color: 'inherit' }}>
                                                <b>{`${filter.name ?? translate('search.metadataFilter.fallbackName')}: `}</b>
                                                {value}
                                            </BodyText>
                                        }
                                        ariaLabel={translate('search.aria.metadataFilterChip')
                                            .replace(
                                                '{0}',
                                                filter.name ?? translate('search.metadataFilter.fallbackName'),
                                            )
                                            .replace('{1}', value)}
                                        onDelete={() => removeMetadata(filter.taxon_id, value, filters)}
                                    />
                                )),
                            )}
                            <Link component="button" type="button" underline="always" onClick={() => onClear(filters)}>
                                {translate('search.clear')}
                            </Link>
                        </>
                    )}
                </Await>
            </Suspense>
        </Grid>
    );
};

const FilterMenu = ({
    defaultExpanded = true,
    showExpandAll = false,
}: {
    defaultExpanded?: boolean;
    showExpandAll?: boolean;
}) => {
    const { t: translate } = useAppTranslation();
    const { nextFilterState, updateFilterState } = useEngagementSearchFilterContext();
    const { statusCounts, metadataFilters, metadataCounts, metadataTotalCounts } =
        useLoaderData() as EngagementSearchLoaderData;
    const [expandedAccordions, setExpandedAccordions] = React.useState<Record<string, boolean>>({});
    const expandAllValue = React.useRef<boolean | null>(null);
    const registerAccordion = React.useCallback((id: string, initialExpanded: boolean) => {
        setExpandedAccordions((current) => ({
            ...current,
            [id]: current[id] ?? expandAllValue.current ?? initialExpanded,
        }));
        return () => {
            setExpandedAccordions((current) => {
                return Object.fromEntries(Object.entries(current).filter(([key]) => key !== id));
            });
        };
    }, []);
    const setAccordionExpanded = (id: string, expanded: boolean) => {
        setExpandedAccordions((current) => ({ ...current, [id]: expanded }));
    };
    const allExpanded = Object.keys(expandedAccordions).length > 0 && Object.values(expandedAccordions).every(Boolean);
    const toggleAllAccordions = () => {
        const shouldExpand = !allExpanded;
        expandAllValue.current = shouldExpand;
        setExpandedAccordions((current) => Object.fromEntries(Object.keys(current).map((id) => [id, shouldExpand])));
    };
    const setQueryParams = (newQueryParams: URLSearchParams) => {
        updateFilterState(newQueryParams);
    };
    const sortBy = new URLSearchParams(nextFilterState).get('sortBy') || 'relevance';
    const setSortBy = (value: string) => {
        const params = new URLSearchParams(nextFilterState);
        params.set('sortBy', value);
        setQueryParams(params);
    };
    const statuses: string[] = new URLSearchParams(nextFilterState).getAll('status');
    const updateStatus = (value: string[], checked: boolean) => {
        const params = new URLSearchParams(nextFilterState);
        if (checked) {
            value.forEach((v) => params.append('status', v));
        } else {
            value.forEach((v) => {
                const existing = params.getAll('status');
                params.delete('status');
                existing.filter((e) => e !== v).forEach((e) => params.append('status', e));
            });
        }
        setQueryParams(params);
    };

    const updateMetadata = (taxonId: number, value: string, checked: boolean, filters: MetadataFilter[]) => {
        const params = new URLSearchParams(nextFilterState);
        const key = metadataParam(taxonId, filters);
        const remaining = metadataParamValues(params, taxonId, filters).filter((v) => v !== value);
        params.delete(key);
        params.delete(`meta-${taxonId}`);
        (checked ? [...remaining, value] : remaining).forEach((v) => params.append(key, v));
        params.delete('page');
        setQueryParams(params);
    };
    return (
        <Grid
            container
            direction="column"
            justifyContent="flex-start"
            alignItems="center"
            size={12}
            borderRadius="4px"
            gap={0}
            spacing={0}
        >
            {showExpandAll && (
                <Link
                    component="button"
                    type="button"
                    size="small"
                    aria-expanded={allExpanded}
                    onClick={toggleAllAccordions}
                    sx={{ alignSelf: 'flex-start', mb: 1 }}
                >
                    {translate(allExpanded ? 'search.collapseAll' : 'search.expandAll')}
                </Link>
            )}
            <SearchAccordion
                id="sort"
                label="Sort by"
                defaultExpanded={defaultExpanded}
                expanded={expandedAccordions.sort ?? expandAllValue.current ?? defaultExpanded}
                onExpandedChange={(expanded) => setAccordionExpanded('sort', expanded)}
                onRegister={registerAccordion}
            >
                <RadioGroup
                    aria-label={translate('search.sort.categoryName')}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <FormControlLabel value="relevance" control={<Radio />} label="Best match" />
                    <FormControlLabel value="newest" control={<Radio />} label="Newest" />
                    <FormControlLabel value="oldest" control={<Radio />} label="Oldest" />
                </RadioGroup>
            </SearchAccordion>
            <SearchAccordion
                id="status"
                label="Status"
                defaultExpanded={defaultExpanded}
                expanded={expandedAccordions.status ?? expandAllValue.current ?? defaultExpanded}
                onExpandedChange={(expanded) => setAccordionExpanded('status', expanded)}
                onRegister={registerAccordion}
            >
                <FormGroup
                    role="group"
                    aria-label={translate('search.statusFilter.categoryName')}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        updateStatus([target.value], target.checked);
                    }}
                >
                    <Suspense fallback={<StatusFiltersLoading />}>
                        <Await resolve={statusCounts} errorElement={null}>
                            {(counts: Record<string, number>) =>
                                statusLabels(translate).map(([value, label]) => (
                                    <FormControlLabel
                                        key={value}
                                        checked={statuses.includes(value)}
                                        disabled={counts[value] === 0}
                                        value={value}
                                        control={<Checkbox />}
                                        label={`${label} (${counts[value] ?? 0})`}
                                    />
                                ))
                            }
                        </Await>
                    </Suspense>
                </FormGroup>
            </SearchAccordion>
            <MetadataTaxonFilters
                filtersPromise={metadataFilters}
                countsPromise={metadataCounts}
                totalCountsPromise={metadataTotalCounts}
                queryParams={nextFilterState}
                onToggle={updateMetadata}
                defaultExpanded={defaultExpanded}
                expandedAccordions={expandedAccordions}
                expandAllValue={expandAllValue.current}
                onExpandedChange={setAccordionExpanded}
                onRegister={registerAccordion}
            />
        </Grid>
    );
};

const SearchResultsLoading = () => (
    <Grid container size={12} direction="column" aria-hidden="true" gap={3}>
        {Array.from({ length: 6 }).map((_, index) => (
            <TileSkeleton key={index} orientation={{ xs: 'vertical', md: 'horizontal' }} />
        ))}
    </Grid>
);

const MetadataTaxonFilters = ({
    defaultExpanded,
    filtersPromise,
    countsPromise,
    totalCountsPromise,
    queryParams,
    onToggle,
    expandedAccordions,
    expandAllValue,
    onExpandedChange,
    onRegister,
}: {
    filtersPromise: Promise<MetadataFilter[]>;
    countsPromise: Promise<Record<string, number>>;
    totalCountsPromise: Promise<Record<string, number>>;
    queryParams: string;
    onToggle: (taxonId: number, value: string, checked: boolean, filters: MetadataFilter[]) => void;
    defaultExpanded: boolean;
    expandedAccordions: Record<string, boolean>;
    expandAllValue: boolean | null;
    onExpandedChange: (id: string, expanded: boolean) => void;
    onRegister: (id: string, initialExpanded: boolean) => () => void;
}) => {
    const [data, setData] = React.useState<{
        filters: MetadataFilter[];
        counts: Record<string, number>;
        totalCounts: Record<string, number>;
    } | null>(null);
    const [loadError, setLoadError] = React.useState(false);
    const { t: translate } = useAppTranslation();

    React.useEffect(() => {
        let active = true;
        setLoadError(false);
        Promise.all([filtersPromise, countsPromise, totalCountsPromise])
            .then(([filters, counts, totalCounts]) => {
                if (active) {
                    setData({ filters, counts, totalCounts });
                }
            })
            .catch(() => {
                if (active) {
                    setLoadError(true);
                }
            });
        return () => {
            active = false;
        };
    }, [filtersPromise, countsPromise, totalCountsPromise]);

    if (loadError) {
        return (
            <>
                {data?.filters.map((filter) => (
                    <MetadataTaxonAccordion
                        key={filter.taxon_id}
                        filter={filter}
                        counts={data.counts}
                        totalCounts={data.totalCounts}
                        allFilters={data.filters}
                        queryParams={queryParams}
                        expanded={
                            expandedAccordions[`metadata-${filter.taxon_id}`] ?? expandAllValue ?? defaultExpanded
                        }
                        defaultExpanded={defaultExpanded}
                        onExpandedChange={(expanded) => onExpandedChange(`metadata-${filter.taxon_id}`, expanded)}
                        onRegister={onRegister}
                        onToggle={onToggle}
                    />
                ))}
                {!data && <MetadataTaxaLoading />}
                <BodyText role="alert">{translate('search.aria.metadataFiltersError')}</BodyText>
            </>
        );
    }

    if (!data) {
        return <MetadataTaxaLoading />;
    }

    return data?.filters.map((filter) => (
        <MetadataTaxonAccordion
            key={filter.taxon_id}
            filter={filter}
            counts={data.counts}
            totalCounts={data.totalCounts}
            allFilters={data.filters}
            queryParams={queryParams}
            expanded={expandedAccordions[`metadata-${filter.taxon_id}`] ?? expandAllValue ?? defaultExpanded}
            defaultExpanded={defaultExpanded}
            onExpandedChange={(expanded) => onExpandedChange(`metadata-${filter.taxon_id}`, expanded)}
            onRegister={onRegister}
            onToggle={onToggle}
        />
    ));
};

const StatusFiltersLoading = () => {
    const { t: translate } = useAppTranslation();
    return (
        <Grid
            container
            direction="column"
            gap={1}
            role="status"
            aria-label={translate('search.aria.loadingStatusFilters')}
            aria-busy="true"
        >
            <Grid aria-hidden="true">
                {statusLabels(translate).map(([value]) => (
                    <Grid key={value} container alignItems="center" gap={1} height={32}>
                        <Skeleton variant="rounded" width={20} height={20} />
                        <Skeleton variant="text" width={120} height={22} />
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
};

const MetadataTaxaLoading = () => {
    const { t: translate } = useAppTranslation();
    return (
        <Grid
            container
            direction="column"
            size={12}
            role="status"
            aria-label={translate('search.aria.loadingMetadataFilters')}
            aria-busy="true"
        >
            <Grid aria-hidden="true" container direction="column" size={12}>
                {[0, 1, 2].map((index) => (
                    <Grid key={index} container alignItems="center" height={38} px={2}>
                        <Skeleton variant="text" width="65%" height={24} />
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
};

const MetadataTaxonAccordion = ({
    filter,
    counts,
    totalCounts,
    allFilters,
    queryParams,
    expanded,
    defaultExpanded,
    onExpandedChange,
    onRegister,
    onToggle,
}: {
    filter: MetadataFilter;
    counts: Record<string, number>;
    totalCounts: Record<string, number>;
    allFilters: MetadataFilter[];
    queryParams: string;
    expanded: boolean;
    defaultExpanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
    onRegister: (id: string, initialExpanded: boolean) => () => void;
    onToggle: (taxonId: number, value: string, checked: boolean, filters: MetadataFilter[]) => void;
}) => {
    const values = filter.values.filter((value) => totalCounts[metadataCountKey(filter.taxon_id, value)] > 0);
    if (values.length === 0) {
        return null;
    }
    return (
        <SearchAccordion
            id={`metadata-${filter.taxon_id}`}
            label={filter.name ?? 'Filter'}
            defaultExpanded={defaultExpanded}
            expanded={expanded}
            onExpandedChange={onExpandedChange}
            onRegister={onRegister}
        >
            <MetadataOptions
                filter={{ ...filter, values }}
                selected={metadataParamValues(new URLSearchParams(queryParams), filter.taxon_id, allFilters)}
                counts={counts}
                onToggle={(value, checked) => onToggle(filter.taxon_id, value, checked, allFilters)}
            />
        </SearchAccordion>
    );
};

const VISIBLE_OPTIONS = 5;

const MetadataOptions = ({
    filter,
    selected,
    counts,
    onToggle,
}: {
    filter: MetadataFilter;
    selected: string[];
    counts: Record<string, number>;
    onToggle: (value: string, checked: boolean) => void;
}) => {
    const [expanded, setExpanded] = React.useState(false);
    const values = [...filter.values].toSorted((a, b) => a.localeCompare(b));
    // Selected values stay visible even when collapsed
    const visible = expanded ? values : values.filter((v, i) => i < VISIBLE_OPTIONS || selected.includes(v));
    const hiddenCount = values.length - visible.length;
    const { t: translate } = useAppTranslation();
    return (
        <>
            <FormGroup
                id={`metadata-options-${filter.taxon_id}`}
                role="group"
                aria-label={filter.name ?? translate('search.metadataFilter.fallbackName')}
                onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    onToggle(target.value, target.checked);
                }}
            >
                {visible.map((value) => (
                    <FormControlLabel
                        key={value}
                        checked={selected.includes(value)}
                        value={value}
                        control={
                            <Checkbox
                                disabled={
                                    counts[metadataCountKey(filter.taxon_id, value)] === 0 && !selected.includes(value)
                                }
                            />
                        }
                        disabled={counts[metadataCountKey(filter.taxon_id, value)] === 0 && !selected.includes(value)}
                        label={
                            <>
                                {value}
                                {` (${counts[metadataCountKey(filter.taxon_id, value)] ?? 0})`}
                            </>
                        }
                    />
                ))}
            </FormGroup>
            {values.length > VISIBLE_OPTIONS && (expanded || hiddenCount > 0) && (
                <Link
                    fontSize="14px"
                    component="button"
                    type="button"
                    underline="always"
                    aria-expanded={expanded}
                    aria-controls={`metadata-options-${filter.taxon_id}`}
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded
                        ? translate('search.metadataFilter.viewLess')
                        : translate('search.metadataFilter.viewMore').replace('{0}', hiddenCount.toString())}
                </Link>
            )}
        </>
    );
};

const SearchAccordion = ({
    id,
    label,
    children,
    defaultExpanded = true,
    expanded,
    onExpandedChange,
    onRegister,
}: {
    id?: string;
    label: React.ReactNode;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    onRegister?: (id: string, initialExpanded: boolean) => () => void;
}) => {
    const accordionId = React.useId();
    const summaryId = `search-accordion-summary-${accordionId}`;
    const detailsId = `search-accordion-details-${accordionId}`;

    React.useEffect(() => {
        if (id && onRegister) {
            return onRegister(id, defaultExpanded);
        }
    }, [defaultExpanded, id, onRegister]);

    return (
        <Accordion
            sx={{ my: '0 !important' }}
            defaultExpanded={expanded === undefined ? defaultExpanded : undefined}
            expanded={expanded}
            onChange={onExpandedChange ? (_, isExpanded) => onExpandedChange(isExpanded) : undefined}
        >
            <AccordionSummary
                id={summaryId}
                aria-controls={detailsId}
                sx={{
                    backgroundColor: 'gray.10',
                    m: '0',
                    minHeight: '38px',
                    '& .MuiAccordionSummary-content, & .MuiAccordionSummary-content.Mui-expanded': {
                        margin: '8px 0',
                        width: '100%',
                    },
                    '&.Mui-expanded': {
                        minHeight: '38px',
                    },
                    '& .MuiAccordionSummary-expandIconWrapper': {
                        color: 'text.primary',
                    },
                }}
                expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
            >
                <BodyText bold size="small" component={typeof label === 'string' ? 'span' : 'div'} width="100%">
                    {label}
                </BodyText>
            </AccordionSummary>
            <AccordionDetails
                id={detailsId}
                role="region"
                aria-labelledby={summaryId}
                sx={{
                    p: '12px 16px',
                    '& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: '22px', py: '8px' },
                }}
            >
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

export default EngagementSearch;
