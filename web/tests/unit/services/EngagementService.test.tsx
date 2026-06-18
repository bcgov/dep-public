// add custom jest matchers from jest-dom
import '@testing-library/jest-dom';
// the component to test
import { getEngagementBySlug, getEngagement } from 'services/engagementService';
import http from 'apiManager/httpRequestHandler';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Engagement } from 'models/engagement';
import { AppConfig } from 'config';
import endpoints from 'apiManager/endpoints';

jest.replaceProperty(AppConfig, 'apiUrl', 'localhost/api');
jest.mock('axios');
jest.mock('services/userService', () => ({
    getToken: jest.fn(() => 'mocked-token'),
}));

const createAxiosLikeError = (
    overrides: Partial<{ message: string; code: string; response: { status: number; data?: unknown } }> = {},
) =>
    ({
        isAxiosError: true,
        message: 'Network Error',
        code: 'ERR_NETWORK',
        ...overrides,
    }) as AxiosError;

(axios.isAxiosError as unknown as jest.Mock).mockImplementation((error: unknown) =>
    Boolean((error as any)?.isAxiosError),
);

const mockEngagementData = {
    id: 1,
    name: 'Test Engagement',
    description: null,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
};

(axios.get as jest.Mock).mockImplementation((url: string, requestOptions: AxiosRequestConfig) => {
    // Simulate default 404 or 500 page for any other URL, which will throw a network error due to CORS preflight failure in the browser environment
    const networkError = createAxiosLikeError();
    if (url.includes(endpoints.Engagement.GET_BY_SLUG.replace('eng_slug', 'test-engagement-slug'))) {
        const tenantId = requestOptions.headers?.['tenant-id'];
        if (tenantId === '1') {
            return Promise.resolve({ data: mockEngagementData });
        } else {
            return Promise.reject(networkError);
        }
    }
    if (url.includes(endpoints.Engagement.GET_BY_SLUG.replace('eng_slug', ''))) {
        return Promise.reject(
            createAxiosLikeError({
                message: 'Request failed with status code 404',
                code: 'ERR_BAD_REQUEST',
                response: {
                    status: 404,
                    data: 'Request failed with status code 404',
                },
            }),
        );
    }
    if (url.includes(endpoints.Engagement.GET.replace('engagement_id', '1'))) {
        return Promise.resolve({ data: mockEngagementData });
    }
    if (url.includes(endpoints.Engagement.GET.replace('engagement_id', ''))) {
        return Promise.reject(
            createAxiosLikeError({
                message: 'Request failed with status code 404',
                code: 'ERR_BAD_REQUEST',
                response: {
                    status: 404,
                    data: 'Request failed with status code 404',
                },
            }),
        );
    }
    return Promise.reject(networkError);
});

(axios.post as jest.Mock).mockImplementation((url: string, data: any, config: AxiosRequestConfig) => {
    if (url === `${AppConfig.apiUrl}/engagements`) {
        const newEngagement = {
            id: 2,
            ...data,
        };
        return Promise.resolve({ data: newEngagement });
    }
    return Promise.reject(createAxiosLikeError({ code: 'ERR_NOT_FOUND' }));
});

describe('Fetching Engagements with EngagementService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fetches engagement by slug successfully', async () => {
        sessionStorage.setItem('tenantId', '1');

        const engagement = await getEngagementBySlug('test-engagement-slug');
        expect(engagement.id).toBe(mockEngagementData.id);
        expect(engagement.name).toBe(mockEngagementData.name);
        expect(engagement.description).toBe(mockEngagementData.description);
        expect(engagement.start_date).toBe(mockEngagementData.start_date);
        expect(engagement.end_date).toBe(mockEngagementData.end_date);
    });

    test('fetches engagement by ID successfully', async () => {
        const engagementId = 1;
        const engagement = await getEngagement(engagementId);
        expect(engagement.id).toBe(mockEngagementData.id);
        expect(engagement.name).toBe(mockEngagementData.name);
        expect(engagement.description).toBe(mockEngagementData.description);
        expect(engagement.start_date).toBe(mockEngagementData.start_date);
        expect(engagement.end_date).toBe(mockEngagementData.end_date);
    });

    test('fetching engagement by slug with invalid slug throws error', async () => {
        sessionStorage.setItem('tenantId', '1');
        await expect(getEngagementBySlug('')).rejects.toThrow('Request failed with status code 404');
    });

    test('fetching engagement by slug with invalid tenant ID throws error', async () => {
        sessionStorage.setItem('tenantId', 'invalid-tenant-id');

        await expect(getEngagementBySlug('test-engagement-slug')).rejects.toThrow('Request failed with status code');
    });
});

describe('EngagementService API call structure', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GetRequest is called with correct URL and headers', async () => {
        sessionStorage.setItem('tenantId', '1');
        await getEngagementBySlug('test-engagement-slug');

        expect(axios.get).toHaveBeenCalledWith(
            endpoints.Engagement.GET_BY_SLUG.replace('eng_slug', 'test-engagement-slug'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-type': 'application/json',
                    Authorization: expect.stringContaining('Bearer '),
                    'tenant-id': '1',
                }),
            }),
        );
    });
});

describe('EngagementService error handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('handles network errors gracefully', async () => {
        (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

        await expect(getEngagementBySlug('test-engagement-slug')).rejects.toThrow('Network Error');
    });
});

describe('EngagementService response handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('handles unexpected response structure', async () => {
        (axios.get as jest.Mock).mockResolvedValueOnce({});

        await expect(getEngagementBySlug('test-engagement-slug')).rejects.toThrow('Failed to fetch engagement by slug');
    });
});

describe('EngagementService: create Engagement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('creates engagement successfully', async () => {
        const newEngagementData = {
            name: 'New Engagement',
            description: 'Description of new engagement',
            start_date: '2024-02-01',
            end_date: '2024-11-30',
        };

        const response = await http.PostRequest<Engagement>(`${AppConfig.apiUrl}/engagements`, newEngagementData);
        expect(response.data).toEqual({
            id: 2,
            ...newEngagementData,
        });
    });
});
