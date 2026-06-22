import React, { useEffect, useState } from 'react';
import { Box, Grid2 as Grid, Skeleton, Divider, useMediaQuery, Stack, ToggleButtonGroup, Paper } from '@mui/material';
import { Palette } from 'styles/Theme';
import { Button } from 'components/common/Input/Button';
import { BodyText, Heading1 } from 'components/common/Typography';
import { QuestionBlock } from './QuestionBlock';
import { SurveyBarData } from '../types';
import { BarBlock } from './BarBlock';
import { TreemapBlock } from './TreemapBlock';
import { getSurveyResultData } from 'services/analytics/surveyResult';
import { Engagement } from 'models/engagement';
import { SurveyResultData, defaultData } from '../../../models/analytics/surveyResult';
import { ErrorBox } from '../ErrorBox';
import { NoData } from '../NoData';
import { If, Then, Else, When } from 'react-if';
import { dashboardCustomStyles } from '../SubmissionTrend/SubmissionTrend';
import axios, { AxiosError } from 'axios';
import { HTTP_STATUS_CODES } from 'constants/httpResponseCodes';
import { useAppTranslation } from 'hooks';

const HEIGHT = 400;

interface SurveyQuestionProps {
    engagement: Engagement;
    engagementIsLoading: boolean;
    commentsUrl?: string;
    dashboardType: string;
}

export const SurveyBar = ({ commentsUrl, engagement, engagementIsLoading, dashboardType }: SurveyQuestionProps) => {
    const { t: translate } = useAppTranslation();
    const isTablet = useMediaQuery((theme) => theme.breakpoints.down('md'));
    const [data, setData] = useState<SurveyResultData | null>(null);
    const [selectedData, setSelectedData] = useState(defaultData[0]);
    const [selectedDataIndex, setSelectedDataIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [chartType, setChartType] = React.useState('bar');

    const handleToggleChange = (event: React.MouseEvent<HTMLElement>, chartByValue: string) => {
        setChartType(chartByValue);
    };

    const setErrors = (error: AxiosError) => {
        if (error.response?.status !== HTTP_STATUS_CODES.NOT_FOUND) {
            setIsError(true);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const response = await getSurveyResultData(Number(engagement.id), dashboardType);
            setData(response);
            setSelectedData(response?.data[0]);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrors(error);
            } else {
                setIsError(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (Number(engagement.id)) {
            fetchData();
        }
    }, [engagement.id]);

    if (isLoading || engagementIsLoading) {
        return <Skeleton variant="rectangular" width={'100%'} height={HEIGHT} />;
    }

    if (!data) {
        return <NoData sx={{ height: HEIGHT }} />;
    }

    if (isError) {
        return (
            <ErrorBox
                sx={{ height: HEIGHT }}
                onClick={() => {
                    fetchData();
                }}
            />
        );
    }

    return (
        <>
            <Grid size={12} mb={0.5} mt={1}>
                <If condition={isTablet}>
                    <Then>
                        <BodyText bold>{translate('dashboard.barBlock.label')}</BodyText>
                    </Then>
                    <Else>
                        <Heading1>{translate('dashboard.barBlock.label')}</Heading1>
                    </Else>
                </If>
            </Grid>
            <Grid ml={0} size={12}>
                <Paper sx={{ p: 2 }}>
                    <Grid size={12}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} width="100%" justifyContent="flex-end">
                            <Grid container size={{ xs: 12, md: 8 }} direction="row" justifyContent="flex-start">
                                <BodyText bold mb={{ xs: 1, m: 2 }} color={Palette.text.primary}>
                                    {translate('dashboard.barBlock.questionLabel')}
                                </BodyText>
                            </Grid>
                            <When condition={!isTablet}>
                                <Grid
                                    container
                                    size={12}
                                    direction="row"
                                    justifyContent={isTablet ? 'center' : 'flex-end'}
                                    alignItems={isTablet ? 'center' : 'flex-end'}
                                >
                                    <ToggleButtonGroup
                                        size={isTablet ? 'small' : 'medium'}
                                        value={chartType}
                                        exclusive
                                        onChange={handleToggleChange}
                                        sx={dashboardCustomStyles.toggleGroup}
                                    >
                                        <Button variant="primary" size="small" value="bar">
                                            {translate('dashboard.barBlock.charType.0')}
                                        </Button>
                                        <Button variant="primary" size="small" value="treemap">
                                            {translate('dashboard.barBlock.charType.1')}
                                        </Button>
                                    </ToggleButtonGroup>
                                </Grid>
                            </When>
                        </Stack>
                        <Divider sx={{ marginTop: '1em' }} />
                    </Grid>
                    <Grid container direction="row" size={12} spacing={1} alignItems={'flex-start'}>
                        <Grid container size={{ xs: 12, md: 4 }}>
                            <Grid container alignItems={'center'} justifyContent={'center'}>
                                <Box
                                    sx={{
                                        width: '100%',
                                    }}
                                >
                                    <QuestionBlock
                                        data={data.data}
                                        selectedQuestionIndex={selectedDataIndex}
                                        handleSelected={(data: SurveyBarData, index: number) => {
                                            setSelectedData(data);
                                            setSelectedDataIndex(index);
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                        <When condition={isTablet}>
                            <Grid size={12}>
                                <BodyText sx={{ fontWeight: 'bold' }}>{translate('dashboard.barBlock.label')}</BodyText>
                            </Grid>
                        </When>
                        <Grid size={{ xs: 12, md: 8 }}>
                            {chartType == 'bar' ? (
                                <BarBlock data={selectedData} />
                            ) : (
                                <TreemapBlock data={selectedData} />
                            )}
                        </Grid>
                    </Grid>

                    <When condition={isTablet}>
                        <Grid container size={12} alignItems="center" justifyContent="center">
                            <Button
                                variant="primary"
                                sx={{ mt: 3, width: '80%' }}
                                data-testid="SurveyBlock/take-me-to-survey-button-mobile"
                                href={commentsUrl}
                            >
                                {translate('dashboard.barBlock.button')}
                            </Button>
                        </Grid>
                    </When>
                </Paper>
            </Grid>
        </>
    );
};

export default SurveyBar;
