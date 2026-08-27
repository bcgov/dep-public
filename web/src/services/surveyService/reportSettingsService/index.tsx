import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';
import { SurveyReportSetting } from 'models/surveyReportSetting';

export const fetchSurveyReportSettings = async (surveyId: string): Promise<SurveyReportSetting[]> => {
    const url = replaceUrl(Endpoints.SurveyReportSetting.GET_LIST, 'survey_id', surveyId);
    const responseData = await http.GetRequest<SurveyReportSetting[]>(url);
    if (!responseData?.data) return [];
    return responseData.data;
};

export const updateSurveyReportSettings = async (
    surveyId: string,
    settingData: SurveyReportSetting[],
    headers?: Record<string, string>,
) => {
    const url = replaceUrl(Endpoints.SurveyReportSetting.UPDATE, 'survey_id', surveyId);
    const responseData = await http.PatchRequest<SurveyReportSetting[]>(url, settingData, headers);
    return responseData?.data || [];
};
