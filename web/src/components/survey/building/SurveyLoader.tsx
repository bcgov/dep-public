import { EmailVerification } from 'models/emailVerification';
import { Engagement } from 'models/engagement';
import { Survey } from 'models/survey';
import { SurveyReportSetting } from 'models/surveyReportSetting';
import { SurveySubmission } from 'models/surveySubmission';
import { Params } from 'react-router';
import { getEmailVerification } from 'services/emailVerificationService';
import { getEngagement, getEngagementBySlug } from 'services/engagementService';
import { getSubmissionByToken } from 'services/submissionService';
import { getSurvey } from 'services/surveyService';
import { fetchSurveyReportSettings } from 'services/surveyService/reportSettingsService';

export type SurveyLoaderData = {
    engagement: Engagement | null;
    language: string | undefined;
    reportSettings: SurveyReportSetting[] | null;
    slug: { slug: string } | null;
    submission: SurveySubmission | null;
    survey: Survey;
    surveyId: string | undefined;
    token: string | undefined;
    verification: EmailVerification | null;
};

export const SurveyLoader = async ({ params }: { params: Params<string> }) => {
    const { surveyId, token, language, engagementId, slug: urlSlug } = params;
    if (Number.isNaN(Number(surveyId)) && !Number.isNaN(Number(engagementId)) && !urlSlug)
        throw new Error('Invalid survey ID');

    const verPromise = token ? getEmailVerification(token) : null;
    const getEngPromise = () => {
        if (urlSlug) {
            return getEngagementBySlug(urlSlug);
        } else if (engagementId && !Number.isNaN(Number(engagementId))) {
            return getEngagement(Number(engagementId));
        } else if (surveyId && !Number.isNaN(Number(surveyId))) {
            const surveyPromise = getSurvey(Number(surveyId));
            return surveyPromise.then((surveyData) => {
                if (!surveyData.engagement_id) {
                    throw new Error('Survey is missing engagement ID');
                }
                return getEngagement(Number(surveyData.engagement_id));
            });
        }
        return null;
    };
    const engPromise = getEngPromise();
    let survey: Survey | null = null;
    try {
        const [engagement, verification] = await Promise.all([engPromise, verPromise]);
        survey = !survey && surveyId ? await getSurvey(Number(surveyId)) : (survey ?? engagement?.surveys?.[0]) || null;

        const submissionPromise = verification?.verification_token
            ? getSubmissionByToken(verification.verification_token)
            : null;
        const reportSettingsPromise = survey?.id ? fetchSurveyReportSettings(String(survey.id)) : null;
        const results = await Promise.all([submissionPromise, reportSettingsPromise]);
        const [submission, reportSettings] = results;
        return { engagement, language, reportSettings, submission, survey, surveyId, token, verification };
    } catch (e) {
        console.error('Failed to get survey data', e);
    }
};

export default SurveyLoader;
