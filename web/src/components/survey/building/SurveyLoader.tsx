import { EmailVerification } from 'models/emailVerification';
import { Engagement } from 'models/engagement';
import { Survey } from 'models/survey';
import { SurveyReportSetting } from 'models/surveyReportSetting';
import { SurveySubmission } from 'models/surveySubmission';
import { LoaderFunctionArgs } from 'react-router';
import { getEmailVerification } from 'services/emailVerificationService';
import { getEngagement, getEngagementBySlug } from 'services/engagementService';
import { getSubmissionByToken } from 'services/submissionService';
import { getSurvey } from 'services/surveyService';
import { fetchSurveyReportSettings } from 'services/surveyService/reportSettingsService';

export type SurveyLoaderData = {
    engagement: Promise<Engagement>;
    reportSettings: Promise<SurveyReportSetting[] | null>;
    submission: Promise<SurveySubmission | null>;
    survey: Promise<Survey>;
    verification: Promise<EmailVerification> | Promise<null>;
};

export const SurveyLoader = async ({ params, pattern }: LoaderFunctionArgs) => {
    const { surveyId: surveyIdParam, token, engagementId: engagementIdParam, slug: slugParam } = params;
    const surveyId = Number(surveyIdParam);
    const engagementId = Number(engagementIdParam);
    if (Number.isNaN(surveyId) && !Number.isNaN(engagementId) && !slugParam) throw new Error('Invalid survey ID');
    const shouldHaveToken = !pattern.startsWith('/manage'); //non-admin users should have a token
    if (shouldHaveToken && !token) {
        throw new Error('Missing verification token');
    }
    const verification = token ? getEmailVerification(token) : Promise.resolve(null);
    const getPromises = () => {
        if (slugParam || (engagementId && !Number.isNaN(engagementId))) {
            // If we are accessing the survey via the engagement
            const engagement = slugParam ? getEngagementBySlug(slugParam) : getEngagement(engagementId);
            const survey = engagement.then((eng) => {
                if (!eng) throw new Error('Engagement not found for slug: ' + slugParam);
                if (surveyId && !Number.isNaN(surveyId)) {
                    return getSurvey(surveyId);
                }
                if (eng.surveys && eng.surveys.length > 0) {
                    return eng.surveys[0];
                }
                throw new Error('No survey found for engagement with slug: ' + slugParam);
            });
            return { engagement, survey };
        } else if (surveyId && !Number.isNaN(surveyId)) {
            // If we are accessing the survey directly via the survey ID
            const survey = getSurvey(surveyId);
            const engagement = survey.then((surveyData) => {
                if (!surveyData.engagement_id) {
                    throw new Error('Survey is missing engagement ID');
                }
                return getEngagement(Number(surveyData.engagement_id));
            });
            return { engagement, survey };
        }
        throw new Error('Invalid parameters: surveyId or engagementId or slug must be provided');
    };

    const { engagement, survey } = getPromises();
    const reportSettings = survey?.then((s) => {
        if (!s) return null;
        return fetchSurveyReportSettings(String(s.id));
    });
    const submission = verification?.then((verif) => {
        if (!verif?.verification_token) return null;
        return getSubmissionByToken(verif.verification_token);
    });

    return { engagement, reportSettings, submission, survey, verification };
};

export default SurveyLoader;
