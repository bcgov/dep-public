import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AppConfig } from 'config';
import { DocumentItem } from 'models/document';
import { prepareHeaders } from 'apiManager//apiSlices/util';

// Define a service using a base URL and expected endpoints
export const documentsApi = createApi({
    reducerPath: 'documentsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: AppConfig.apiUrl,
        prepareHeaders,
    }),
    endpoints: (builder) => ({
        getDocuments: builder.query<DocumentItem[], number>({
            query: (widget_id) => `widgets/${widget_id}/documents`,
            transformResponse: (response: DocumentItem[]) => response || [],
        }),
    }),
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: 600,
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useLazyGetDocumentsQuery } = documentsApi;
