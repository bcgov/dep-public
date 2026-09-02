import { AccordionDetails, AccordionSummary, Divider, Grid2 as Grid, Skeleton, Tooltip } from '@mui/material';
import { BodyText, Heading2, Heading3 } from 'components/common/Typography';
import React from 'react';
import { faChevronDown, faMessage } from '@fortawesome/pro-solid-svg-icons';
import { faBoxBallot } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EngagementAccordion } from 'components/common/Layout';

export const CommentReviewSkeleton = () => {
    return (
        <Grid
            container
            size={12}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            rowSpacing={4}
            maxWidth="1120px"
        >
            <Grid container direction="row" spacing={2}>
                <Grid container alignItems="center" direction="row" size={'auto'} spacing={1}>
                    <Heading2 my={0} bold>
                        <Skeleton variant="text" width="200px" />
                    </Heading2>
                </Grid>

                <Grid container alignItems="center" direction="row" size={'grow'} spacing={1}>
                    <Skeleton variant="rounded" height="32px" width="100px" />
                </Grid>
                <Grid container direction="row" size={12}>
                    <Grid container direction="row" size={6} spacing={1}>
                        <Grid alignItems="center" justifyContent="center">
                            <BodyText bold>Comment Date:</BodyText>
                        </Grid>
                        <Grid alignItems="center" justifyContent="center">
                            <BodyText>
                                <Skeleton variant="text" width="84px" />
                            </BodyText>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={1} alignItems="center">
                    <Grid>
                        <BodyText bold>Reviewed by:</BodyText>
                    </Grid>
                    <Grid>
                        <Skeleton variant="rounded" height="32px" width="115px" />
                    </Grid>
                </Grid>
                <Grid container spacing={1} alignItems="center">
                    <Grid>
                        <BodyText bold>Date Reviewed:</BodyText>
                    </Grid>
                    <Grid>
                        <BodyText>
                            <Skeleton variant="text" width="100px" />
                        </BodyText>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container size={12} direction="row" rowSpacing={2} className="formio multipageform form-wrapper">
                <EngagementAccordion disabled sx={{ width: '100%' }}>
                    <AccordionSummary
                        sx={{ flexDirection: 'row-reverse' }}
                        expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
                        aria-controls="form-submission-content"
                    >
                        <FontAwesomeIcon
                            icon={faBoxBallot}
                            style={{ marginRight: '0.5rem', fontSize: '1.25rem', padding: '5px' }}
                        />
                        <Heading3 bold>Form Submission Data</Heading3>
                    </AccordionSummary>
                    <AccordionDetails></AccordionDetails>
                </EngagementAccordion>
            </Grid>
            <Grid container rowSpacing={2}>
                <Grid size={12}>
                    <Heading3 bold>Comments</Heading3>
                </Grid>
                {[1, 2, 3].map((index) => {
                    return (
                        <Grid key={index} size={12}>
                            <Divider />
                            <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start">
                                <Grid size={1} paddingTop={3}>
                                    <Grid size={12}>
                                        <Tooltip
                                            disableInteractive
                                            title={'Displayed to the public'}
                                            placement="top"
                                            arrow
                                        >
                                            <span>
                                                <FontAwesomeIcon
                                                    icon={faMessage}
                                                    style={{ fontSize: '24px', color: '#757575' }}
                                                />
                                            </span>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                                <Grid size={11}>
                                    <Grid size={12} paddingTop={2}>
                                        <BodyText bold>
                                            <Skeleton variant="text" width="150px" />
                                        </BodyText>
                                    </Grid>
                                    <Grid size={12}>
                                        <BodyText>
                                            <Skeleton variant="text" width="300px" />
                                        </BodyText>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    );
                })}
                <Grid size={12}>
                    <Divider />
                </Grid>
            </Grid>
        </Grid>
    );
};
