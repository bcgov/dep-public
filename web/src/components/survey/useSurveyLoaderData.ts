import { useRouteLoaderData, useLoaderData } from 'react-router';
import { SurveyLoaderData } from './building/SurveyLoader';

export const useSurveyLoaderData = () => {
    const surveyLoaderData = useRouteLoaderData('survey');
    const publicSurveyLoaderData = useRouteLoaderData('public-survey');
    // if the route is not a child of one of the 'survey' routes,
    // we can still expect the survey data from the nearest route's loader
    const fallbackData = useLoaderData();

    return (surveyLoaderData ?? publicSurveyLoaderData ?? fallbackData) as SurveyLoaderData;
};
