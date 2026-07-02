/**
 * Dev Logger — wraps console methods with context labels.
 * In production (__DEV__ === false) all methods are no-ops.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function format(level: LogLevel, screen: string, message: string, data?: unknown): string {
  const time = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  return `[${time}] [${level.toUpperCase()}] [${screen}] ${message}${data !== undefined ? ' →' : ''}`;
}

export const Logger = {
  info(screen: string, message: string, data?: unknown): void {
    if (!isDev) return;
    data !== undefined
      ? console.log(format('info', screen, message, data), data)
      : console.log(format('info', screen, message));
  },

  debug(screen: string, message: string, data?: unknown): void {
    if (!isDev) return;
    data !== undefined
      ? console.debug(format('debug', screen, message, data), data)
      : console.debug(format('debug', screen, message));
  },

  warn(screen: string, message: string, data?: unknown): void {
    if (!isDev) return;
    data !== undefined
      ? console.warn(format('warn', screen, message, data), data)
      : console.warn(format('warn', screen, message));
  },

  error(screen: string, message: string, error?: unknown): void {
    if (!isDev) return;
    if (error instanceof Error) {
      console.error(format('error', screen, message, error), '\nStack:', error.stack);
    } else {
      error !== undefined
        ? console.error(format('error', screen, message, error), error)
        : console.error(format('error', screen, message));
    }
  },

  /** Log GraphQL ApolloError with full detail */
  gqlError(screen: string, operation: string, err: unknown): void {
    if (!isDev) return;
    const e = err as any;
    console.error(
      `[${new Date().toISOString().slice(11, 23)}] [GQL-ERROR] [${screen}] ${operation}`,
      '\n  message :', e?.message,
      '\n  graphQL  :', JSON.stringify(e?.graphQLErrors ?? []),
      '\n  network  :', e?.networkError?.message,
    );
  },
};
