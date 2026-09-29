import { Engagement } from 'models/engagement';

export type EngagementSearchLoaderData = {
    q?: string;
    engagements: Promise<Engagement[]>;
};

export const engagementSearchLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const queryParams = url.searchParams;

    return {
        q: queryParams.get('q') ?? undefined,
        // Future: handle parameters and return search results
        engagements: Promise.resolve([]),
    } as EngagementSearchLoaderData;
};

export default engagementSearchLoader;
