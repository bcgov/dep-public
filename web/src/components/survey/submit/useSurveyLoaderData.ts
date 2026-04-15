import { useRouteLoaderData } from 'react-router';
import { SurveyLoaderData } from '../building/SurveyLoader';

export const useSurveyLoaderData = () => {
    return (useRouteLoaderData('survey') ?? useRouteLoaderData('public-survey')) as SurveyLoaderData;
};
