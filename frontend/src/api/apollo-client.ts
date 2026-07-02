import { ApolloClient, InMemoryCache, createHttpLink, CombinedGraphQLErrors } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { getSecureItem } from './storage';
import { Logger } from '../utils/logger';

const httpLink = createHttpLink({
  uri: 'http://10.0.0.2:3000/graphql', // Points to computer's local network IP
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getSecureItem('access_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Apollo Client v4: error handler receives { error, operation }
// error is CombinedGraphQLErrors for GQL errors, or a network Error
const errorLink = new ErrorLink(({ error, operation }) => {
  if (!error) return;
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path }) => {
      Logger.error('Apollo', `[GQL] ${operation.operationName}: ${message}`, { locations, path });
    });
  } else {
    Logger.error('Apollo', `[Network] ${operation.operationName}`, error);
  }
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
});
