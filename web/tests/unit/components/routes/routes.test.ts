import { ROUTES, getPath } from 'routes/routes';

describe('routes/getPath', () => {
    test('returns static route without params', () => {
        expect(getPath(ROUTES.HOME)).toEqual('/manage');
        expect(getPath(ROUTES.PUBLIC_LANDING)).toEqual('/');
    });

    test('interpolates route params', () => {
        expect(getPath(ROUTES.SURVEY_BUILD, { surveyId: '123' })).toEqual('/manage/surveys/123/build');
        expect(getPath(ROUTES.USER_DETAILS, { userId: 42 })).toEqual('/manage/users/42/details');
        expect(getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, { slug: 'my-engagement', language: 'en' })).toEqual(
            '/my-engagement/en',
        );
    });

    test('supports multi-param interpolation', () => {
        expect(
            getPath(ROUTES.PUBLIC_MANAGE_SUBSCRIPTION, {
                engagementId: '88',
                subscriptionStatus: 'unsubscribe',
                scriptionKey: 'abc123',
                language: 'fr',
            }),
        ).toEqual('/engagements/88/unsubscribe/abc123/fr');
    });
});

// Compile-time type checks.
// These are intentionally not runtime assertions -
// they will cause TypeScript compilation errors if the types are not correct,
// which is the main point of these tests.
const typeSafetyChecks = () => {
    getPath(ROUTES.SURVEY_BUILD, { surveyId: '1' });
    getPath(ROUTES.HOME);

    // @ts-expect-error - surveyId is required for SURVEY_BUILD.
    getPath(ROUTES.SURVEY_BUILD);

    // @ts-expect-error - HOME does not accept params.
    getPath(ROUTES.HOME, { surveyId: '1' });

    // @ts-expect-error - USER_DETAILS requires userId.
    getPath(ROUTES.USER_DETAILS, {});
};
