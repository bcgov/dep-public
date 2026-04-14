import React, { useContext, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { RepeatedGrid } from 'components/common';
import { TileSkeleton } from './TileSkeleton';
import EngagementTile from './EngagementTile';
import { LandingContext } from './LandingContext';
import NoResult from 'routes/NoResults';
import { LiveAnnouncer, LiveMessage } from 'react-aria-live';
import { Pagination } from 'components/common/Input';
import { PAGE_SIZE } from './constants';

const TileBlock = () => {
    const { engagements, loadingEngagements, page, setPage, totalEngagements } = useContext(LandingContext);
    const [ariaStatusMessage, setAriaStatusMessage] = useState(`Results updated. ${totalEngagements} results`);

    useEffect(() => {
        setAriaStatusMessage(`${totalEngagements} results`);
    }, [totalEngagements]);

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
                maxWidth="xl"
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
    if (engagements.length == 0) {
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
                aria-label={`Engagements list. ${totalEngagements} results.`}
                direction="row"
                columnSpacing={5}
                justifyContent={'space-between'}
                rowSpacing={4}
                size={12}
                maxWidth="xl"
            >
                {engagements.map((engagement) => (
                    <Grid
                        component="li"
                        container
                        key={engagement.id}
                        size="auto"
                        sx={{
                            flexBasis: '320px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            listStyleType: 'none',
                        }}
                    >
                        <Grid width="320px">
                            <EngagementTile passedEngagement={engagement} engagementId={engagement.id} />
                        </Grid>
                    </Grid>
                ))}
                {/* Add 3 empty grid items to make sure final row is left aligned */}
                {Array(3)
                    .fill(0)
                    .map((_, index) => (
                        <Grid
                            component="li"
                            key={`empty-${index}`}
                            size="auto"
                            sx={{
                                height: '1px',
                                flexBasis: '320px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                justifySelf: 'start',
                                listStyleType: 'none',
                            }}
                        />
                    ))}
                <Grid
                    size={12}
                    container
                    direction="row"
                    alignItems={'center'}
                    justifyContent="center"
                    marginBottom="2em"
                >
                    <Grid>
                        <Pagination
                            defaultPage={1}
                            page={page}
                            count={Math.ceil(totalEngagements / PAGE_SIZE)}
                            color="primary"
                            showFirstButton
                            showLastButton
                            onChange={(_, pageNumber) => setPage(pageNumber)}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </LiveAnnouncer>
    );
};

export default TileBlock;
