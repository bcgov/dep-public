import '@testing-library/jest-dom';
import { createDefaultSurvey, Survey } from 'models/survey';
import {
    createDefaultEngagement,
    createDefaultEngagementSettings,
    Engagement,
    EngagementMetadata,
    EngagementSettings,
    MetadataTaxon,
} from 'models/engagement';
import { EngagementStatus } from 'constants/engagementStatus';
import { WidgetType, Widget, WidgetItem, WidgetLocation } from 'models/widget';
import { Event, EventItem } from 'models/event';
import { WidgetMap } from 'models/widgetMap';
import { PollWidget, PollAnswer } from 'models/pollWidget';
import { VideoWidget } from 'models/videoWidget';
import { TimelineWidget, TimelineEvent, EventStatus } from 'models/timelineWidget';
import { Tenant } from 'models/tenant';
import { UserState } from 'services/userService/types';
import { USER_ROLES } from 'services/userService/constants';
import { ImageWidget } from 'models/imageWidget';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';

const tenant: Tenant = {
    name: 'Tenant 1',
    title: 'Tenant Title',
    description: 'Tenant Description',
    short_name: 'tenant1',
};

const survey: Survey = {
    ...createDefaultSurvey(),
    id: 1,
    name: 'Survey 1',
    engagement_id: 1,
};

const surveys = [survey];

const draftEngagement: Engagement = {
    ...createDefaultEngagement(),
    id: 1,
    name: 'Test Engagement',
    created_date: '2022-09-14 20:16:29.846877',
    rich_description:
        '{"blocks":[{"key":"bqupg","text":"Test description","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    description: 'Test description',
    description_title: 'Test description title',
    start_date: '2026-01-17 12:00:00',
    end_date: '2026-09-30 12:00:00',
    surveys: surveys,
    engagement_status: {
        id: EngagementStatus.Draft,
        status_name: 'Draft',
    },
};

const closedEngagement = {
    ...draftEngagement,
    id: 3,
    name: 'Closed Engagement',
    engagement_status: {
        id: EngagementStatus.Closed,
        status_name: 'Closed',
    },
    start_date: '2022-09-01 12:00:00',
    end_date: '2023-03-30 12:00:00',
    created_date: '2022-09-15 10:00:00',
    published_date: '2022-09-19 10:00:00',
    surveys: surveys,
    submissions_meta_data: {
        total: 1,
        pending: 0,
        needs_further_review: 0,
        rejected: 0,
        approved: 1,
    },
};

const openEngagement = {
    ...draftEngagement,
    id: 2,
    name: 'Open Engagement',
    status_id: EngagementStatus.Published,
    scheduled_date: '2024-09-19 10:00:00',
    engagement_status: {
        id: EngagementStatus.Published,
        status_name: 'Published',
    },
    start_date: '2026-01-17 12:00:00',
    end_date: '2026-09-30 12:00:00',
    created_date: '2024-09-15 10:00:00',
    published_date: '2024-09-19 10:00:00',
    surveys: surveys,
    submissions_meta_data: {
        total: 1,
        pending: 0,
        needs_further_review: 0,
        rejected: 0,
        approved: 1,
    },
};

const mockEventItem: EventItem = {
    id: 1,
    event_name: 'event name',
    description: 'description',
    location_name: 'location name',
    location_address: 'location address',
    start_date: 'start date',
    end_date: 'end date',
    url: 'link',
    url_label: 'link label',
    sort_index: 1,
    widget_events_id: 0,
    created_by: 'test',
    updated_by: 'test',
    created_date: 'test date',
    updated_date: 'test date',
};

const mockEvent: Event = {
    id: 1,
    title: 'Events',
    type: 'OPENHOUSE',
    sort_index: 1,
    widget_id: 1,
    created_by: 'test',
    updated_by: 'test',
    event_items: [mockEventItem],
};

const eventWidgetItem: WidgetItem = {
    id: 1,
    widget_id: 1,
    widget_data_id: 1,
    sort_index: 1,
};

const eventWidget: Widget = {
    id: 1,
    title: 'Events',
    widget_type_id: WidgetType.Events,
    engagement_id: 1,
    items: [eventWidgetItem],
    location: WidgetLocation.Summary,
};

const mapWidgetItem: WidgetItem = {
    id: 1,
    widget_id: 1,
    widget_data_id: 1,
    sort_index: 1,
};

const mapWidget: Widget = {
    id: 1,
    title: 'Map',
    widget_type_id: WidgetType.Map,
    engagement_id: 1,
    items: [mapWidgetItem],
    location: WidgetLocation.Summary,
};

const mockMap: WidgetMap = {
    id: 1,
    widget_id: 1,
    engagement_id: 1,
    longitude: 0,
    latitude: 0,
    marker_label: 'test',
    geojson: '',
    file_name: 'test.zip',
};

const pollWidget: Widget = {
    id: 1,
    title: 'Poll',
    widget_type_id: WidgetType.Poll,
    engagement_id: 1,
    items: [],
    location: WidgetLocation.Summary,
};

const videoWidget: Widget = {
    id: 1,
    title: 'Video',
    widget_type_id: WidgetType.Video,
    engagement_id: 1,
    items: [],
    location: WidgetLocation.Summary,
};

const timeLineWidget: Widget = {
    id: 1,
    title: 'Timeline',
    widget_type_id: WidgetType.Timeline,
    engagement_id: 1,
    items: [],
    location: WidgetLocation.Summary,
};

const imageWidget: Widget = {
    id: 1,
    title: 'Image',
    widget_type_id: WidgetType.Image,
    engagement_id: 1,
    items: [],
    location: WidgetLocation.Summary,
};

const mockPollAnswer1: PollAnswer = {
    id: 0,
    answer_text: 'answer 1',
};

const mockPollAnswer2: PollAnswer = {
    id: 1,
    answer_text: 'answer 2',
};

const mockPoll: PollWidget = {
    id: 1,
    widget_id: 1,
    engagement_id: 1,
    title: 'Poll',
    description: 'Test description',
    status: 'active',
    answers: [mockPollAnswer1, mockPollAnswer2],
};

const mockVideo: VideoWidget = {
    id: 1,
    widget_id: 1,
    engagement_id: 1,
    video_url: 'https://youtube.url',
    description: 'Video description',
};

const mockImage: ImageWidget = {
    id: 1,
    widget_id: 1,
    engagement_id: 1,
    image_url: 'https://image.url',
    alt_text: 'Image alt text',
    description: 'Image description',
};

const mockTimeLineEvent1: TimelineEvent = {
    id: 1,
    engagement_id: 1,
    widget_id: 1,
    timeline_id: 1,
    description: 'Time Line Event One Description',
    time: '2022-09-14 20:16:29.846877',
    status: EventStatus.Pending,
    position: 1,
};

const mockTimeLine: TimelineWidget = {
    id: 1,
    widget_id: 1,
    engagement_id: 1,
    title: 'Time Line Title',
    description: 'Time Line Description',
    events: [mockTimeLineEvent1],
};

const engagementMetadata: EngagementMetadata = {
    engagement_id: 1,
    taxon_id: 1,
    value: 'test',
};

const engagementMetadataTaxon: MetadataTaxon = {
    tenant_id: 1,
    id: 1,
    name: 'test',
    data_type: 'text',
    one_per_engagement: false,
    freeform: true,
    preset_values: ['test'],
    position: 1,
};

const engagementSetting: EngagementSettings = {
    ...createDefaultEngagementSettings(),
    engagement_id: 1,
};

const engagementSlugData = {
    slug: 'test-engagement-slug',
};

const engagementDetailsTabData: EngagementDetailsTab = {
    id: 1,
    engagement_id: 1,
    label: 'Tab 1',
    slug: 'tab_1',
    heading: '',
    body: '',
    sort_index: 1,
};

const staffUserState: Partial<UserState> = {
    userDetail: {
        user: {
            first_name: 'Test',
            last_name: 'User',
            main_role: USER_ROLES.VIEW_ENGAGEMENT,
            roles: [USER_ROLES.VIEW_ENGAGEMENT, USER_ROLES.MANAGE_METADATA, USER_ROLES.VIEW_USERS],
            composite_roles: [USER_ROLES.VIEW_ENGAGEMENT],
            contact_number: '1234567890',
            email_address: 'blah@example.com',
            id: 123,
            created_date: '2021-01-01T00:00:00.000Z',
            description: 'Test User',
            external_id: '123',
            status_id: 1,
            updated_date: '2021-01-01T00:00:00.000Z',
            username: 'testuser',
        },
    },
    authentication: {
        loading: false,
        authenticated: true,
    },
    roles: [USER_ROLES.VIEW_ENGAGEMENT, USER_ROLES.MANAGE_METADATA, USER_ROLES.VIEW_USERS],
};

export {
    tenant,
    draftEngagement,
    openEngagement,
    closedEngagement,
    surveys,
    mockEvent,
    mockEventItem,
    mapWidget,
    mockMap,
    eventWidgetItem,
    eventWidget,
    engagementMetadata,
    engagementMetadataTaxon,
    engagementSlugData,
    engagementSetting,
    mockPoll,
    pollWidget,
    videoWidget,
    mockVideo,
    timeLineWidget,
    imageWidget,
    mockImage,
    mockTimeLine,
    engagementDetailsTabData,
    staffUserState,
};
