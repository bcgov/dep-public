import React, { Suspense } from 'react';
import { BodyText, Heading1 } from 'components/common/Typography';
import { Dialog, DialogContent, Grid2 as Grid, Skeleton } from '@mui/material';
import { Layout } from 'styles/Theme';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { TextInput } from 'components/common/Input/TextInput';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { useNavigate, useLocation, useLoaderData, Await } from 'react-router';
import { EngagementSearchLoaderData } from './engagementSearchLoader';

export const EngagementSearch = () => {
    const queryParams = useLocation().search;
    const loaderData = useLoaderData() as EngagementSearchLoaderData;
    const [searchTerm, setSearchTerm] = React.useState(loaderData.q);
    const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);

    const navigate = useNavigate();

    const setQueryParams = (newQueryParams: URLSearchParams) => {
        navigate('./?' + newQueryParams.toString());
    };

    const handleSearch = () => {
        const newQueryParams = new URLSearchParams(queryParams);
        if (searchTerm) {
            newQueryParams.set('q', searchTerm);
        } else {
            newQueryParams.delete('q');
        }
        setQueryParams(newQueryParams);
    };

    return (
        <Grid container size={12} justifyContent="center" spacing={3} px={Layout.padding.default}>
            <Grid container size={12} maxWidth={Layout.width.default}>
                <Grid size={12} pt={4}>
                    <AutoBreadcrumbs />
                </Grid>
                {/* Desktop: Sort and filter menu */}
                <Grid container size={3.5} display={{ xs: 'none', md: 'flex' }}>
                    <BodyText bold lineHeight="28px" mt={3}>
                        Sort and filter
                    </BodyText>
                    <FilterMenu />
                </Grid>
                {/* Mobile: Sort and filter dialog */}
                <Dialog
                    open={filterMenuOpen}
                    onClose={() => setFilterMenuOpen(false)}
                    sx={{ display: { xs: 'block', md: 'none' } }}
                    slotProps={{ paper: { sx: { minWidth: '320px' } } }}
                >
                    <DialogContent>
                        <Grid container size={12}>
                            <Grid size="grow">
                                <BodyText bold lineHeight="28px" mb={3} py="2px">
                                    Sort and filter
                                </BodyText>
                            </Grid>
                            <Grid size="auto">
                                <Button
                                    sx={{ width: '32px', height: '32px', minWidth: 0 }}
                                    size="small"
                                    variant="tertiary"
                                    icon={<FontAwesomeIcon icon={faTimes} />}
                                    onClick={() => setFilterMenuOpen(false)}
                                />
                            </Grid>
                        </Grid>
                        <FilterMenu />
                    </DialogContent>
                </Dialog>
                {/* Engagement search results column */}
                <Grid container size={{ xs: 12, md: 8.5 }} direction="column">
                    <Grid size={12}>
                        <Heading1 weight="thin" mb={1}>
                            Find public engagement opportunities
                        </Heading1>
                    </Grid>
                    {/* Search bar and search button */}
                    <Grid container size={12}>
                        <Grid container size="grow" justifyContent="flex-start">
                            <TextInput
                                value={searchTerm}
                                onChange={(value) => setSearchTerm(value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                                sx={{ height: '40px', borderColor: 'gray.80', width: '100%' }}
                                startAdornment={<FontAwesomeIcon style={{ fontSize: '18px' }} icon={faSearch} />}
                                placeholder="By keyword"
                            />
                        </Grid>
                        <Grid container size="auto">
                            <Button onClick={handleSearch} variant="primary" size="small">
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                    {/* Mobile sort and filter button */}
                    <Grid size={12} sx={{ display: { xs: 'block', md: 'none' } }}>
                        <Button size="small" onClick={() => setFilterMenuOpen(true)}>
                            Sort and Filter
                        </Button>
                    </Grid>
                    {/* Engagement results */}
                    <Suspense fallback={<Skeleton variant="rounded" width="100%" height="500px" />}>
                        <Await resolve={loaderData.engagements}>
                            {(engagements) =>
                                engagements.map((engagement) => <div key={engagement.id}>{engagement.name}</div>)
                            }
                        </Await>
                    </Suspense>
                </Grid>
            </Grid>
        </Grid>
    );
};

const FilterMenu = () => (
    <Grid
        container
        justifyContent="center"
        alignItems="center"
        size={12}
        borderRadius="8px"
        border="1px solid"
        color="blue.30"
        height="600px"
    >
        Placeholder
    </Grid>
);

export default EngagementSearch;
