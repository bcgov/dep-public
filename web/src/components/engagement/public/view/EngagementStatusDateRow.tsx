import React from 'react';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { BodyText } from 'components/common/Typography';
import { EngagementStatusChip } from 'components/common/Indicators';
import { SubmissionStatus } from 'constants/engagementStatus';
import { convertToPacific } from 'components/common/dateHelper';
import { StatusChipSkeleton } from 'components/common/Indicators/StatusChip';

interface EngagementStatusDateRowProps {
    statusId: SubmissionStatus;
    startDate: string;
    endDate: string;
    marginBottom?: string;
}

export const EngagementStatusDateRow: React.FC<EngagementStatusDateRowProps> = ({
    statusId,
    startDate,
    endDate,
    marginBottom = '1rem',
}) => {
    const dateFormat = 'MMM DD, YYYY';
    const semanticDateFormat = 'YYYY-MM-DD';
    const start = convertToPacific(startDate);
    const end = convertToPacific(endDate);

    return (
        <Grid container mb={marginBottom} flexDirection="row" alignItems="center" columnSpacing={1} rowSpacing={1}>
            <Grid>
                <EngagementStatusChip statusId={statusId} />
            </Grid>
            <Grid>
                <BodyText bold size="small" sx={{ color: '#201F1E' }}>
                    <time dateTime={`${start.format(semanticDateFormat)}`}>{start.format(dateFormat)}</time> to{' '}
                    <time dateTime={`${end.format(semanticDateFormat)}`}>{end.format(dateFormat)}</time>
                </BodyText>
            </Grid>
        </Grid>
    );
};

export const EngagementStatusDateRowSkeleton: React.FC<{ marginBottom?: string }> = ({ marginBottom = '1rem' }) => {
    return (
        <Grid container mb={marginBottom} flexDirection="row" alignItems="center" columnSpacing={1} rowSpacing={1}>
            <Grid>
                <StatusChipSkeleton />
            </Grid>
            <Grid container alignItems="center" columnSpacing={1}>
                <BodyText bold size="small" sx={{ color: '#201F1E', display: 'flex', alignItems: 'center' }}>
                    <Skeleton variant="text" width="90px" />
                    <Skeleton variant="text" width="20px" sx={{ mx: '4px' }} />
                    <Skeleton variant="text" width="90px" />
                </BodyText>
            </Grid>
        </Grid>
    );
};
