// GraphQL client for The Graph
import { GraphQLClient } from 'graphql-request';

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || '';

export const graphqlClient = new GraphQLClient(SUBGRAPH_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function for making GraphQL requests
export async function graphqlRequest<T = any>(
  query: string,
  variables?: any
): Promise<T> {
  if (!SUBGRAPH_URL) {
    console.warn('NEXT_PUBLIC_SUBGRAPH_URL not configured, returning mock data');
    return {} as T;
  }

  try {
    return await graphqlClient.request<T>(query, variables);
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}