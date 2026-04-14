import React, { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { FormProvider, useForm, Resolver } from 'react-hook-form';
import { createSearchParams, useFetcher, Outlet, useMatch } from 'react-router';
import { convertToRaw, EditorState } from 'draft-js';
import * as yup from 'yup';
import { EngagementViewSections } from 'components/engagement/public/view';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { saveObject } from 'services/objectStorageService';
import { FormDetailsTab } from './types';
import { AuthoringPreviewWindowProvider } from './AuthoringPreviewWindowContext';
import { ROUTES, getPath } from 'routes/routes';

const tabSchema = yup.object({
    id: yup.number().required(),
    engagement_id: yup.number().required(),
    label: yup.string().required('Label is required').max(20, 'Label text must be 20 characters or less'),
    slug: yup.string().required(),
    sort_index: yup.number().required(),
    heading: yup.string().required('Heading is required').max(60, 'Eyebrow text must be 60 characters or less'),
    body: yup.mixed().test('body-not-empty', 'Body cannot be empty', (value) => {
        return value?.getCurrentContent()?.hasText();
    }),
});

const detailsTabsSchema = yup.object({
    id: yup.number().required(),
    form_source: yup.string().required(),
    details_tabs: yup
        .array()
        .default([])
        .when('form_source', (form_source, schema) => {
            if (form_source === 'details') {
                return schema.of(tabSchema).min(1, 'At least one tab is required');
            }
            return schema;
        }),
});

const summarySchema = yup.object({
    id: yup.number().required(),
    rich_description: yup.string().required(),
    description_title: yup.string().required(),
    description: yup.string().required(),
    summary_editor_state: yup.mixed().test('body-not-empty', 'Body cannot be empty', (value) => {
        return value?.getCurrentContent()?.hasText();
    }),
});

const feedbackSchema = yup.object({
    id: yup.number().required(),
    feedback_heading: yup.string().required().max(60),
    feedback_body: yup.mixed().test('body-not-empty', 'Body cannot be empty', (value) => {
        return value?.getCurrentContent()?.hasText();
    }),
    surveys: yup.array().default([]),
    selected_survey_id: yup.number().typeError('Please select a valid survey or the None option.').integer(),
});

const dupeMsg = 'Each suggested engagement can only be chosen once';
const moreEngagementsSchema = yup.object({
    id: yup.number().required(),
    more_engagements_heading: yup
        .string()
        .required('Heading is required')
        .max(60, 'Heading must be 60 characters or less'),
    more_engagements_1: yup.number().test('dup-1', dupeMsg, function (val) {
        return testMoreEngagementsValue(this, val);
    }),
    more_engagements_2: yup.number().test('dup-2', dupeMsg, function (val) {
        return testMoreEngagementsValue(this, val);
    }),
    more_engagements_3: yup.number().test('dup-3', dupeMsg, function (val) {
        return testMoreEngagementsValue(this, val);
    }),
});

const testMoreEngagementsValue = (that: yup.TestContext, value: number | undefined) => {
    const { more_engagements_1, more_engagements_2, more_engagements_3 } = that.parent ?? {};
    const fields = [more_engagements_1, more_engagements_2, more_engagements_3];
    // Ignore default values
    if (value === undefined || value === null || value === -1) return true;
    // Check for number validity and duplicates
    return Number.isFinite(value) && fields.filter((f) => f === value)?.length < 2;
};

const subscribeSchema = yup.object({
    id: yup.number().required(),
    subscribe_section_heading: yup.string().required().max(60),
    subscribe_section_description: yup.mixed().test('body-not-empty', 'Body cannot be empty', (value) => {
        return value?.getCurrentContent()?.hasText();
    }),
    subscribe_consent_message: yup.mixed().test('body-not-empty', 'Body cannot be empty', (value) => {
        return value?.getCurrentContent()?.hasText();
    }),
    form_source: yup.string().required(),
});

const authoringTemplateSchema = yup.object({
    name: yup.string().required('Engagement title is required'),
    eyebrow: yup.string().nullable().max(40, 'Eyebrow text must be 40 characters or less'),
    form_source: yup.string().required(),
    image_url: yup
        .string()
        .url('Image URL must be a valid URL')
        .when('image_file', (image_file: File, schema: yup.AnySchema) => {
            return image_file ? schema.notRequired() : schema.required('An image is required');
        }),
    image_file: yup.mixed().nullable(),
    upcoming_message: yup.string(),
    _upcoming_message_plain: yup.string().max(150, '"Upcoming" state message must be 150 characters or less'),
    open_cta: yup.string().max(20, '"Open" state CTA must be 20 characters or less'),
    open_cta_link_type: yup.string().required('Primary CTA link type is required').oneOf(['internal', 'external']),
    open_section_link: yup
        .string()
        .nullable()
        .when('cta_link_type', {
            is: 'internal',
            then: yup.string().required('Section link is required').oneOf(Object.values(EngagementViewSections)),
        }),
    open_external_link: yup
        .string()
        .nullable()
        .when('cta_link_type', {
            is: 'external',
            then: yup.string().url('External link must be a valid URL').required('A link is required'),
        }),
    closed_message: yup.string(),
    _closed_message_plain: yup.string().max(150, '"Closed" state message must be 150 characters or less'),
    view_results_cta: yup.string().nullable().max(20, '"View Results" state CTA must be 20 characters or less'),
    view_results_link_type: yup.string().required('View results link type is required').oneOf(['internal', 'external']),
    view_results_section_link: yup
        .string()
        .nullable()
        .when('view_results_link_type', {
            is: 'internal',
            then: yup.string().required('A link is required').oneOf(Object.values(EngagementViewSections)),
        }),
    view_results_external_link: yup
        .string()
        .nullable()
        .when('view_results_link_type', {
            is: 'external',
            then: yup.string().url('External link must be a valid URL').required('A link is required'),
        }),
});

export interface EngagementUpdateData
    extends
        yup.TypeOf<typeof authoringTemplateSchema>,
        yup.TypeOf<typeof feedbackSchema>,
        yup.TypeOf<typeof subscribeSchema>,
        yup.TypeOf<typeof summarySchema>,
        yup.TypeOf<typeof detailsTabsSchema>,
        yup.TypeOf<typeof moreEngagementsSchema> {
    id: number;
    status_id: number;
    taxon_id: number;
    content_id: number;
    name: string;
    start_date: Dayjs;
    end_date: Dayjs;
    description: string;
    rich_description: string;
    description_title: string;
    banner_filename: string;
    status_block: string[];
    title: string;
    icon_name: string;
    metadata_value: string;
    send_report: boolean | undefined;
    slug: string;
    request_type: string;
    text_content: string;
    json_content: string;
    summary_editor_state: EditorState;
    details_tabs: FormDetailsTab[];
    feedback_section_heading: string;
    feedback_body_copy: string;
    feedback_editor_state: EditorState;
    feedback_survey_button_text: string;
    feedback_third_party_cta_text: string;
    feedback_third_party_cta_link: string;
    feedback_widget_type: string;
    subscribe_section_heading: string;
    subscribe_section_description: EditorState;
    subscribe_consent_message: EditorState;
    form_source: string;
}

export const defaultValuesObject = {
    id: 0,
    status_id: 0,
    taxon_id: 0,
    content_id: 0,
    start_date: dayjs(new Date(1970, 0, 1)),
    end_date: dayjs(new Date(1970, 0, 1)),
    description: '',
    rich_description: '',
    description_title: '',
    banner_filename: '',
    status_block: [],
    title: '',
    icon_name: '',
    metadata_value: '',
    send_report: undefined,
    slug: '',
    request_type: '',
    text_content: '',
    json_content: '{ blocks: [], entityMap: {} }',
    summary_editor_state: EditorState.createEmpty(),
    // Hero banner fields
    name: '',
    eyebrow: '',
    image_url: '',
    image_file: undefined,
    upcoming_message: '',
    _upcoming_message_plain: '',
    open_cta: '',
    open_cta_link_type: 'internal',
    open_section_link: EngagementViewSections.PROVIDE_FEEDBACK,
    open_external_link: '',
    closed_message: '',
    _closed_message_plain: '',
    view_results_cta: '',
    view_results_link_type: 'internal',
    view_results_section_link: EngagementViewSections.PROVIDE_FEEDBACK,
    view_results_external_link: '',
    // Feedback fields
    feedback_heading: '',
    feedback_body: '',
    surveys: [],
    selected_survey_id: -1,
    // Details fields
    details_tabs: [],
    // Provide feedback fields
    feedback_section_heading: '',
    feedback_body_copy: '',
    feedback_editor_state: EditorState.createEmpty(),
    feedback_survey_button_text: '',
    feedback_third_party_cta_text: '',
    feedback_third_party_cta_link: '',
    feedback_widget_type: '',
    // More engagements fields
    more_engagements_heading: '',
    more_engagements_1: -1,
    more_engagements_2: -1,
    more_engagements_3: -1,
    // Subscribe fields
    subscribe_section_heading: '',
    subscribe_section_description: EditorState.createEmpty(),
    subscribe_consent_message: EditorState.createEmpty(),
    // Determines which page the form is being sent from
    form_source: '',
} as EngagementUpdateData;

export const AuthoringContext = () => {
    const [defaultValues, setDefaultValues] = useState(defaultValuesObject);
    const fetcher = useFetcher();
    // Check if the form has succeeded or failed after a submit, and issue a message to the user.
    const dispatch = useAppDispatch();
    useEffect(() => {
        if ('success' === fetcher.data || 'failure' === fetcher.data) {
            const responseText =
                'success' === fetcher.data ? 'Engagement saved successfully.' : 'Unable to save engagement.';
            const responseSeverity = 'success' === fetcher.data ? 'success' : 'error';
            dispatch(
                openNotification({
                    severity: responseSeverity,
                    text: responseText,
                }),
            );
            fetcher.data = undefined;
        }
    }, [fetcher.data]);
    const pageName = useMatch(ROUTES.AUTHORING_PAGE)?.params.page;
    /* Changes the resolver based on the page name. 
    If you require more complex validation, you can 
    define your own resolver and add a case for it here.
    Using a global resolver is not recommended as required
    fields will still be validated on other pages.
     */

    const resolver = useMemo<Resolver<EngagementUpdateData> | undefined>(() => {
        switch (pageName) {
            case 'feedback':
                return yupResolver(feedbackSchema) as unknown as Resolver<EngagementUpdateData>;
            case 'banner':
                // on the banner page, we need inter-field validation so we use the yup resolver
                return yupResolver(authoringTemplateSchema) as unknown as Resolver<EngagementUpdateData>;
            case 'summary':
                return yupResolver(summarySchema) as unknown as Resolver<EngagementUpdateData>;
            case 'details':
                return yupResolver(detailsTabsSchema) as unknown as Resolver<EngagementUpdateData>;
            case 'more':
                return yupResolver(moreEngagementsSchema) as unknown as Resolver<EngagementUpdateData>;
            case 'subscribe':
                return yupResolver(subscribeSchema) as unknown as Resolver<EngagementUpdateData>;
            default:
                return undefined;
        }
    }, [pageName]);
    const engagementUpdateForm = useForm<EngagementUpdateData>({
        defaultValues: useMemo(() => defaultValues, [defaultValues]),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        resolver: resolver,
    });
    const onSubmit = async (data: EngagementUpdateData) => {
        const savedImageDetails = data.image_file
            ? await saveObject(data.image_file, { filename: data.image_file.name })
            : undefined;

        fetcher.submit(
            createSearchParams({
                id: 0 === data.id ? '' : data.id.toString(),
                status_id: 0 === data.status_id ? '' : String(data.status_id),
                taxon_id: 0 === data.taxon_id ? '' : String(data.taxon_id),
                content_id: 0 === data.content_id ? '' : String(data.content_id),
                name: data.name,
                start_date:
                    '1970-01-01' === data.start_date.format('YYYY-MM-DD') ? '' : data.start_date.format('YYYY-MM-DD'),
                end_date:
                    '1970-01-01' === data.start_date.format('YYYY-MM-DD') ? '' : data.end_date.format('YYYY-MM-DD'),
                description: data.description,
                rich_description: data.rich_description,
                description_title: data.description_title,
                status_block: data.status_block,
                title: data.title,
                icon_name: data.icon_name,
                metadata_value: data.metadata_value,
                send_report: (data.send_report || '').toString(),
                slug: data.slug,
                request_type: data.request_type,
                text_content: data.text_content,
                json_content: data.json_content,
                form_source: data.form_source || '',

                banner_filename: savedImageDetails?.uniquefilename || '',

                eyebrow: data.eyebrow || '',
                upcoming_message: data.upcoming_message || '',
                _upcoming_message_plain: data._upcoming_message_plain || '',
                open_cta: data.open_cta || '',
                open_cta_link_type: data.open_cta_link_type || '',
                open_section_link: data.open_section_link || '',
                open_external_link: data.open_external_link || '',
                closed_message: data.closed_message || '',
                _closed_message_plain: data._closed_message_plain || '',
                view_results_cta: data.view_results_cta || '',
                view_results_link_type: data.view_results_link_type || '',
                view_results_section_link: data.view_results_section_link || '',
                view_results_external_link: data.view_results_external_link || '',

                feedback_heading: data.feedback_heading || '',
                feedback_body:
                    data.feedback_body && JSON.stringify(convertToRaw(data.feedback_body.getCurrentContent())),
                surveys: JSON.stringify(data.surveys),
                selected_survey_id: data.selected_survey_id?.toString() || '',

                subscribe_section_heading: data.subscribe_section_heading || '',
                subscribe_section_description:
                    data.subscribe_section_description &&
                    JSON.stringify(convertToRaw(data.subscribe_section_description.getCurrentContent())),
                subscribe_consent_message:
                    data.subscribe_consent_message &&
                    JSON.stringify(convertToRaw(data.subscribe_consent_message.getCurrentContent())),

                details_tabs: JSON.stringify(
                    data.details_tabs.map((tab) => ({
                        ...tab,
                        body: convertToRaw(tab.body.getCurrentContent()),
                    })),
                ),
                more_engagements_heading: data.more_engagements_heading || '',
                more_engagements_1: data.more_engagements_1?.toString() || '',
                more_engagements_2: data.more_engagements_2?.toString() || '',
                more_engagements_3: data.more_engagements_3?.toString() || '',
            }),
            {
                method: 'post',
                action: getPath(ROUTES.AUTHORING_PAGE, { engagementId: data.id, page: pageName ?? 'banner' }),
            },
        );
    };

    return (
        <AuthoringPreviewWindowProvider>
            <FormProvider key={pageName || 'authoring-form'} {...engagementUpdateForm}>
                <Outlet context={{ onSubmit, defaultValues, setDefaultValues, fetcher }} />
            </FormProvider>
        </AuthoringPreviewWindowProvider>
    );
};

export default AuthoringContext;
