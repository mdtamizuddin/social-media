# Project Overview

This is a mobile application project consisting of a React Native (Expo) frontend and a NestJS (GraphQL) backend.

## Tech Stack
- **Frontend**: React Native (Expo), Apollo Client (v4), TypeScript
- **Backend**: NestJS, GraphQL, MongoDB (Mongoose), Pusher (Real-time)
- **Package Managers**: `pnpm` (Frontend), `yarn` (Backend)

## Architectural Guidelines and Quirks

### Frontend (Expo / React Native)
- **Environment**: The user uses BlueStacks as the Android emulator. `ANDROID_HOME` is set to `C:\Android`.
- **Apollo Client v4 Rules**:
  - `useQuery`, `useMutation`, and `useLazyQuery` must be imported from `@apollo/client/react`, NOT `@apollo/client`.
  - The `onError` callback is NOT supported in the options object of `useQuery` or `useMutation` hooks. It will cause a crash (`TypeError: undefined is not a function`).
  - All GraphQL and network errors are handled globally via `ErrorLink` in `src/api/apollo-client.ts`.
  - When distinguishing errors in `ErrorLink`, use `CombinedGraphQLErrors.is(error)` to check for GraphQL errors.
- **Pusher (Real-time)**:
  - `pusher-js` requires specific handling for React Native vs Web.
  - On React Native, it is a CommonJS module bundled with Webpack. The `Pusher` constructor is exported as `module.exports.Pusher` or `module.exports.default`. See `src/context/RealTimeContext.tsx` for the `getPusherClass` implementation.
- **Expo Secure Store**:
  - `expo-secure-store` cannot be imported at the top level on the Web, as it invokes native methods during bundle time. It must be lazily required or loaded conditionally (e.g., inside functions). See `src/api/storage.ts`.
- **Date Handling**:
  - Use `new Date(dateString)` instead of `parseInt` for parsing ISO date strings, as `parseInt` returns `NaN` in many JS environments for ISO strings.
- **Iterators**:
  - Prefer `Object.keys` over `Object.entries` in UI loops to ensure compatibility with environments missing ES6 iterator features.
- **Error Handling & Logging**:
  - The app uses a global `ErrorUtils` handler in `App.tsx` to catch unhandled JS exceptions.
  - A centralized logger (`src/utils/logger.ts`) is used for all dev logging. It is a no-op in production (`__DEV__ === false`).

### Backend (NestJS)
- Start command: `yarn start:dev`

## Tasks & Workflow
- **Linting & Formatting**: Ensure to run `pnpm lint`, `pnpm tsc`, and `pnpm test` in the frontend directory after making significant changes.
- **Running the App**: Use `npm start` (or `pnpm start`) in the frontend directory to start the Expo Metro bundler.
