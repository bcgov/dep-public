import { AppConfig } from 'config';

const Endpoints = {
    Engagement: {
        GET_LIST: `${AppConfig.apiUrl}/engagements/`,
        CREATE: `${AppConfig.apiUrl}/engagements/`,
        UPDATE: `${AppConfig.apiUrl}/engagements/`,
        GET: `${AppConfig.apiUrl}/engagements/engagement_id`,
        DELETE: `${AppConfig.apiUrl}/engagements/engagement_id/delete`,
    },
    EngagementTranslations: {
        GET_TRANSLATION_LANGUAGES: `${AppConfig.apiUrl}/engagement/engagement_id/translations/languages`,
    },
    EngagementMetadata: {
        GET_BY_ENG: `${AppConfig.apiUrl}/engagements/engagement_id/metadata`,
        GET_BY_KEY: `${AppConfig.apiUrl}/engagements/engagement_id/tenant/tenant_id/key`,
        CREATE: `${AppConfig.apiUrl}/engagements/engagement_id/metadata`,
        BULK_UPDATE: `${AppConfig.apiUrl}/engagements/engagement_id/metadata`,
        UPDATE: `${AppConfig.apiUrl}/engagements/engagement_id/metadata/key`,
        DELETE: `${AppConfig.apiUrl}/engagements/engagement_id/metadata/key`,
    },
    MetadataTaxa: {
        GET_BY_TENANT: `${AppConfig.apiUrl}/engagement_metadata/taxa`,
        FILTER_BY_TENANT: `${AppConfig.apiUrl}/engagement_metadata/taxa/filters/`,
        REORDER: `${AppConfig.apiUrl}/engagement_metadata/taxa`,
        CREATE: `${AppConfig.apiUrl}/engagement_metadata/taxa`,
        GET: `${AppConfig.apiUrl}/engagement_metadata/taxon/taxon_id`,
        UPDATE: `${AppConfig.apiUrl}/engagement_metadata/taxon/taxon_id`,
        DELETE: `${AppConfig.apiUrl}/engagement_metadata/taxon/taxon_id`,
        PRESET_VALUES: `${AppConfig.apiUrl}/engagement_metadata/taxon/taxon_id/preset_values`,
    },
    EngagementSettings: {
        CREATE: `${AppConfig.apiUrl}/engagementsettings/`,
        UPDATE: `${AppConfig.apiUrl}/engagementsettings/`,
        GET: `${AppConfig.apiUrl}/engagementsettings/engagement_id`,
    },
    EngagementSlug: {
        UPDATE: `${AppConfig.apiUrl}/slugs/slug_id`,
        GET: `${AppConfig.apiUrl}/slugs/slug_id`,
        GET_ENG_ID: `${AppConfig.apiUrl}/slugs/engagements/engagement_id`,
    },
    EngagementDetailsTab: {
        GET_LIST: `${AppConfig.apiUrl}/engagement/engagement_id/details`,
        CREATE: `${AppConfig.apiUrl}/engagement/engagement_id/details`,
        UPDATE: `${AppConfig.apiUrl}/engagement/engagement_id/details`,
    },
    User: {
        GET: `${AppConfig.apiUrl}/user/user_id`,
        DELETE: `${AppConfig.apiUrl}/user/user_id`,
        CREATE_UPDATE: `${AppConfig.apiUrl}/user/`,
        GET_LIST: `${AppConfig.apiUrl}/user/`,
        ADD_TO_COMPOSITE_ROLE: `${AppConfig.apiUrl}/user/user_id/roles`,
        CHANGE_COMPOSITE_ROLE: `${AppConfig.apiUrl}/user/user_id/roles`,
        GET_USER_ENGAGEMENTS: `${AppConfig.apiUrl}/user/user_id/engagements`,
        TOGGLE_USER_STATUS: `${AppConfig.apiUrl}/user/user_id/status`,
    },
    Document: {
        OSS_HEADER: `${AppConfig.apiUrl}/document/`,
    },
    Survey: {
        GET_LIST: `${AppConfig.apiUrl}/surveys/`,
        CREATE: `${AppConfig.apiUrl}/surveys/`,
        CLONE: `${AppConfig.apiUrl}/surveys/survey_id/clone`,
        UPDATE: `${AppConfig.apiUrl}/surveys/`,
        LINK_TO_ENGAGEMENT: `${AppConfig.apiUrl}/surveys/survey_id/link/engagement/engagement_id`,
        UNLINK_FROM_ENGAGEMENT: `${AppConfig.apiUrl}/surveys/survey_id/unlink/engagement/engagement_id`,
        GET: `${AppConfig.apiUrl}/surveys/survey_id`,
        DELETE: `${AppConfig.apiUrl}/surveys/survey_id/delete`,
    },
    SurveySubmission: {
        REVIEW: `${AppConfig.apiUrl}/submissions/submission_id`,
        GET_LIST: `${AppConfig.apiUrl}/submissions/survey/survey_id`,
        GET: `${AppConfig.apiUrl}/submissions/submission_id`,
    },
    SurveyReportSetting: {
        GET_LIST: `${AppConfig.apiUrl}/surveys/survey_id/reportsettings`,
        UPDATE: `${AppConfig.apiUrl}/surveys/survey_id/reportsettings`,
        CREATE: `${AppConfig.apiUrl}/surveys/survey_id/reportsettings`,
    },
    Subscription: {
        GET: `${AppConfig.apiUrl}/subscription/participant_id`,
        CREATE: `${AppConfig.apiUrl}/subscription/`,
        UNSUBSCRIBE: `${AppConfig.apiUrl}/subscription/`,
        CREATE_UPDATE: `${AppConfig.apiUrl}/subscription/manage`,
        CREATE_FORM: `${AppConfig.apiUrl}/widgets/widget_id/subscribe`,
        GET_FORM_LIST: `${AppConfig.apiUrl}/widgets/widget_id/subscribe`,
        UPDATE_FORM: `${AppConfig.apiUrl}/widgets/widget_id/subscribe/subscribe_id/item/item_id`,
        DELETE_FORM: `${AppConfig.apiUrl}/widgets/widget_id/subscribe/subscribe_id`,
        SORT_FORMS: `${AppConfig.apiUrl}/widgets/widget_id/subscribe/sort_index`,
        CONFIRM_SUBSCRIPTION: `${AppConfig.apiUrl}/subscription/manage`,
    },
    PublicSubmission: {
        CREATE: `${AppConfig.apiUrl}/submissions/public/verification_token`,
        GET_BY_TOKEN: `${AppConfig.apiUrl}/submissions/public/verification_token`,
        UPDATE: `${AppConfig.apiUrl}/submissions/public/verification_token`,
    },
    Comment: {
        GET_LIST: `${AppConfig.apiUrl}/comments/survey/survey_id`,
        GET_STAFF_SPREAD_SHEET: `${AppConfig.apiUrl}/comments/survey/survey_id/sheet/staff`,
        GET_PROPONENT_SPREAD_SHEET: `${AppConfig.apiUrl}/comments/survey/survey_id/sheet/proponent`,
    },
    Feedback: {
        GET_LIST: `${AppConfig.apiUrl}/feedbacks/`,
        CREATE: `${AppConfig.apiUrl}/feedbacks/`,
        UPDATE: `${AppConfig.apiUrl}/feedbacks/feedback_id`,
        DELETE: `${AppConfig.apiUrl}/feedbacks/feedback_id`,
    },
    EmailVerification: {
        GET: `${AppConfig.apiUrl}/email_verification/verification_token`,
        UPDATE: `${AppConfig.apiUrl}/email_verification/verification_token`,
        CREATE: `${AppConfig.apiUrl}/email_verification/`,
        CREATE_SUBSCRIBE: `${AppConfig.apiUrl}/email_verification/subscription_type/subscribe`,
    },
    Widgets: {
        GET: `${AppConfig.apiUrl}/widgets/widget_id/engagements/engagement_id`,
        GET_LIST: `${AppConfig.apiUrl}/widgets/engagement/engagement_id`,
        CREATE: `${AppConfig.apiUrl}/widgets/engagement/engagement_id`,
        DELETE: `${AppConfig.apiUrl}/widgets/widget_id/engagements/engagement_id`,
    },
    Widget_items: {
        GET_LIST: `${AppConfig.apiUrl}/widgets/widget_id/items`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/items`,
    },
    Contacts: {
        GET: `${AppConfig.apiUrl}/contacts/contact_id`,
        GET_LIST: `${AppConfig.apiUrl}/contacts/`,
        CREATE: `${AppConfig.apiUrl}/contacts/`,
        UPDATE: `${AppConfig.apiUrl}/contacts/`,
    },
    Documents: {
        GET_LIST: `${AppConfig.apiUrl}/widgets/widget_id/documents`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/documents`,
        ORDER: `${AppConfig.apiUrl}/widgets/widget_id/documents/order`,
        DELETE: `${AppConfig.apiUrl}/widgets/widget_id/documents/document_id`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/documents/document_id`,
    },
    EngagementTeamMembers: {
        GET_LIST: `${AppConfig.apiUrl}/engagements/engagement_id/members`,
        GET_LIST_BY_USER: `${AppConfig.apiUrl}/engagements/all/members/user_id`,
        CREATE: `${AppConfig.apiUrl}/engagements/engagement_id/members`,
        UPDATE_STATUS: `${AppConfig.apiUrl}/engagements/engagement_id/members/user_id/status`,
    },
    Events: {
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/events`,
        GET_LIST: `${AppConfig.apiUrl}/widgets/widget_id/events`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/events/event_id/item/item_id`,
        DELETE: `${AppConfig.apiUrl}/widgets/widget_id/events/event_id`,
        SORT: `${AppConfig.apiUrl}/widgets/widget_id/events/sort_index`,
    },
    Maps: {
        GET_LIST: `${AppConfig.apiUrl}/widgets/widget_id/maps`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/maps`,
        SHAPEFILE_PREVIEW: `${AppConfig.apiUrl}/shapefile`,
    },
    VideoWidgets: {
        GET: `${AppConfig.apiUrl}/widgets/widget_id/videos`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/videos`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/videos/video_widget_id`,
    },
    TimelineWidgets: {
        GET: `${AppConfig.apiUrl}/widgets/widget_id/timelines`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/timelines`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/timelines/timeline_id`,
    },
    ListeningWidgets: {
        GET: `${AppConfig.apiUrl}/widgets/widget_id/listening_widgets`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/listening_widgets`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/listening_widgets/listening_widget_id`,
    },
    ImageWidgets: {
        GET: `${AppConfig.apiUrl}/widgets/widget_id/images`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/images`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/images/image_widget_id`,
    },
    Tenants: {
        CREATE: `${AppConfig.apiUrl}/tenants/`,
        GET: `${AppConfig.apiUrl}/tenants/tenant_id`,
        GET_LIST: `${AppConfig.apiUrl}/tenants/`,
        GET_OWN: `${AppConfig.apiUrl}/user/me/tenants`,
        UPDATE: `${AppConfig.apiUrl}/tenants/tenant_id`,
        DELETE: `${AppConfig.apiUrl}/tenants/tenant_id`,
    },
    AnalyticsUserResponseDetail: {
        GET_COUNT_BY_MONTH: `${AppConfig.analyticsApiUrl}/responses/month/engagement_id`,
        GET_COUNT_BY_WEEK: `${AppConfig.analyticsApiUrl}/responses/week/engagement_id`,
    },
    AnalyticsAggregator: {
        GET_COUNT: `${AppConfig.analyticsApiUrl}/counts/`,
    },
    AnalyticsMap: {
        GET: `${AppConfig.analyticsApiUrl}/engagements/map/engagement_id`,
    },
    AnalyticsSurveyResult: {
        GET: `${AppConfig.analyticsApiUrl}/surveyresult/engagement_id/dashboard_type`,
    },
    CACForm: {
        CREATE: `${AppConfig.apiUrl}/engagements/engagement_id/cacform/widget_id`,
        GET_SHEET: `${AppConfig.apiUrl}/engagements/engagement_id/cacform/sheet`,
    },
    PollWidgets: {
        GET: `${AppConfig.apiUrl}/widgets/widget_id/polls`,
        CREATE: `${AppConfig.apiUrl}/widgets/widget_id/polls`,
        UPDATE: `${AppConfig.apiUrl}/widgets/widget_id/polls/poll_id`,
        RECORD_RESPONSE: `${AppConfig.apiUrl}/widgets/widget_id/polls/poll_id/responses`,
    },
    Languages: {
        GET: `${AppConfig.apiUrl}/languages/`,
        GET_TENANT_LANGUAGES: `${AppConfig.apiUrl}/languages/tenant/tenant_id`,
        CREATE_OR_DELETE_TENANT_MAPPING: `${AppConfig.apiUrl}/languages/language_id/tenant/tenant_id`,
    },
    Version: {
        GET: `${AppConfig.apiUrl}/version/`,
    },
};

export default Endpoints;
