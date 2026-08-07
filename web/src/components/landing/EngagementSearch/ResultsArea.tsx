import React, { useState, useEffect, useContext } from 'react';
import Grid from '@mui/material/Grid2';
import { RepeatedGrid } from 'components/common';
import { TileSkeleton } from './TileSkeleton';
import EngagementTile from './EngagementTile';
import NoResult from 'routes/NoResults';
import { LiveAnnouncer, LiveMessage } from 'react-aria-live';
import { Pagination } from 'components/common/Input';
import { LandingDataContext } from '..';
import { Engagement } from 'models/engagement';
import { updateSearchParams } from '../utils';

const ResultsArea = () => {
    const {
        engagements: engs,
        loadingEngagements,
        setLoadingEngagements,
        searchParams,
        setSearchParams,
    } = useContext(LandingDataContext);
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [count, setCount] = useState(0);
    const [ariaStatusMessage, setAriaStatusMessage] = useState(
        `Results updated. ${count || engagements.length || 0} results`,
    );

    useEffect(() => {
        setLoadingEngagements(true);
        const collectEngagementInfo = async () => {
            try {
                const es = await engs;
                if (es) {
                    setEngagements(es.items);
                    setCount(es.total);
                    setAriaStatusMessage(`${es?.total} results`);
                }
            } finally {
                setLoadingEngagements(false);
            }
        };
        collectEngagementInfo();
    }, [engs]);

    if (loadingEngagements) {
        return (
            <Grid
                container
                paddingLeft={0}
                direction="row"
                columnSpacing={5}
                justifyContent={'space-between'}
                rowSpacing={4}
                size={12}
            >
                <RepeatedGrid
                    times={8}
                    container
                    size="auto"
                    sx={{
                        flexBasis: '320px',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Grid width="320px">
                        <TileSkeleton />
                    </Grid>
                </RepeatedGrid>
            </Grid>
        );
    }
    if (!engagements || engagements.length === 0) {
        return (
            <Grid
                container
                direction="row"
                justifyContent={'space-between'}
                alignItems="flex-start"
                columnSpacing={{ xs: 0, sm: 2 }}
                rowSpacing={4}
                size={10}
            >
                <NoResult />
                <ul aria-label="Engagements list. No results."></ul>
            </Grid>
        );
    }
    return (
        <LiveAnnouncer>
            <LiveMessage message={ariaStatusMessage} aria-live="assertive" />
            <Grid
                container
                paddingLeft={0}
                component="ul"
                my={0}
                mb="4.5rem"
                aria-label={`Engagements list. ${count} results.`}
                direction="row"
                columnSpacing={5}
                justifyContent={{ xs: 'center', md: 'space-between' }}
                rowSpacing={4}
                size={12}
                display="grid"
                sx={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 320px))',
                }}
            >
                {engagements?.map((engagement) => (
                    <Grid
                        container
                        component="li"
                        key={engagement.id}
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            listStyleType: 'none',
                            minWidth: '320px',
                        }}
                    >
                        <EngagementTile passedEngagement={engagement} engagementId={engagement.id} />
                    </Grid>
                ))}
            </Grid>
            <Grid size={12} container direction="row" alignItems={'center'} justifyContent="center" marginBottom="2em">
                <Grid>
                    <Pagination
<<<<<<<< HEAD:web/src/components/landing/EngagementSearch/ResultsArea.tsx
                        defaultPage={1}
                        page={Number(searchParams.get('page')) || 1}
                        count={Math.ceil(count / Number(searchParams.get('size') || 8))}
                        color="primary"
                        showFirstButton
                        showLastButton
========
                        page={Number(searchParams.get('page')) || 1}
                        count={Math.ceil(count / Number(searchParams.get('size') || 8))}
>>>>>>>> main:web/src/components/landing/ResultsArea.tsx
                        onChange={(_, pageNumber) =>
                            setSearchParams(updateSearchParams({ page: pageNumber }, searchParams))
                        }
                    />
                </Grid>
            </Grid>
        </LiveAnnouncer>
    );
};

export default ResultsArea;
