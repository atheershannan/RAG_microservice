/**
 * RTK Query API for RAG microservice
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const ragApi = createApi({
  reducerPath: 'ragApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Query', 'Recommendation'],
  endpoints: (builder) => ({
    submitQuery: builder.mutation({
      query: (body) => ({
        url: '/api/v1/query',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Query'],
    }),
    getRecommendations: builder.query({
      query: (userId) => `/api/v1/personalized/recommendations/${userId}`,
      providesTags: ['Recommendation'],
    }),
  }),
});

export const { useSubmitQueryMutation, useGetRecommendationsQuery } = ragApi;



