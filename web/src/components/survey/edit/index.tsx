import React, { Suspense } from 'react';
import SurveySubmitWrapped from './FormWrapped';
import { Await } from 'react-router';
import { useSurveyLoaderData } from '../useSurveyLoaderData';
import { Skeleton } from '@mui/material';

const SurveySubmit = () => {
    const { verification, engagement, submission } = useSurveyLoaderData();
    return (
        <Suspense fallback={<Skeleton variant="rectangular" width="100%" height="38em" />}>
            <Await resolve={Promise.all([verification, engagement, submission])}>
                <SurveySubmitWrapped />
            </Await>
        </Suspense>
    );
};

export default SurveySubmit;
