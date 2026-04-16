import { useRouteLoaderData } from 'react-router';
import { SurveyLoaderData } from '../building/SurveyLoader';

export const useSurveyLoaderData = () => {
    const surveyLoaderData = useRouteLoaderData('survey');
    const publicSurveyLoaderData = useRouteLoaderData('public-survey');

    return (surveyLoaderData ?? publicSurveyLoaderData) as SurveyLoaderData;
};
