# Play Together App

Expo / React Native client for the **Play Together** platform, talking to the NestJS API v2.

It covers the player-facing surface: OTP registration and password reset, hobby onboarding,
search and filtering, player profiles with weekly availability, the hire → accept → session →
review flow, wallet (deposits, withdrawals, pending credits), charity donations, ratings, reports,
feedback, chat, notifications, search history and recommendations.

## Stack

Expo SDK 58 · React Native 0.88 · React 19 · Expo Router · TanStack Query 5 · Zustand 5 · axios

## Getting started

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL, defaults to http://localhost:3000/api/v2
npm start              # Expo dev server; press w for web, or scan the QR in Expo Go
```

The API must be running (see `play-together-be`). Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Player | `demo.player1..6@playtogether.local` | `Demo@12345` |
| Hirer | `demo.hirer1..2@playtogether.local` | `Demo@12345` |
| Charity | `charity@playtogether.local` | `Charity@12345` |

Every native module used here ships inside **Expo Go**, so no development build is needed for the
demo. After adding a library with native code, build one with `npx expo run:ios|android` or
`eas build --profile development`.

Web works too: `npm run web` serves the app on port 8081 with `localStorage` standing in for
SecureStore.

## Scripts

```bash
npm start             # Expo dev server (Metro)
npm run android       # dev server + Android client
npm run ios           # dev server + iOS simulator
npm run web           # dev server + browser on port 8081
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npm run api:generate  # regenerate src/api/generated from the API OpenAPI document
```

## Configuration

`src/api/endpoints.ts` reads `EXPO_PUBLIC_API_URL` and falls back to
`http://localhost:3000/api/v2`. Expo inlines `EXPO_PUBLIC_*` variables at bundle time, so restart
Metro (`npx expo start -c`) after changing `.env`. The file is git-ignored; `.env.example` is the
tracked template.

On a physical device `localhost` points at the phone, not your machine — use your machine's LAN IP
(`EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v2`) and make sure the API is listening on it.

Google sign-in is optional: set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `_IOS_` / `_ANDROID_` (see
`.env.example`) and `GOOGLE_CLIENT_ID` on the API. Without them the Google button only shows a
"not configured" hint and email + password still works.

## API layer

The app was written against the original v1 API, so `src/api` is an anti-corruption layer that
keeps the legacy view models while every request goes to v2:

| Path | Role |
| --- | --- |
| `src/api/client.ts` | axios instance, bearer token, `problem+json` → `ApiError`, single-flight refresh on `401` with one retry |
| `src/api/endpoints.ts` | `API_ROOT` plus the feature URL prefixes |
| `src/api/v2/types.ts` | Wire types for the v2 responses |
| `src/api/v2/mappers.ts` | `toLegacy*` mappers from v2 wire types to the app's existing models |
| `src/api/services/` | `auth`, `users`, `catalog`, `orders`, `content` — screens call these, never axios directly |
| `src/api/generated/` | Orval output (`npm run api:generate`), kept for the next migration step; no screen imports it yet |

Auth state lives in `src/store/auth.ts` (Zustand). Tokens are persisted through
`src/lib/storage.ts` — `expo-secure-store` on device, `localStorage` on web — and the store is
bootstrapped once from `src/app/_layout.tsx`, which also redirects signed-out users to
`/(auth)/login`.

## Routes

Every file under `src/app/` is a screen (Expo Router); `_layout.tsx` files define the navigators.

```text
src/app/
  _layout.tsx                  Fonts, splash, auth bootstrap, signed-out redirect
  index.tsx                    Entry redirect
  (auth)/                      login, register, complete-register, forgot-password, change-password
  (tabs)/                      home, charity, history, notifications, personal
  onboarding/take-categories   Hobby selection after first sign-in
  player/[id]                  Public profile + availability
  player-list, filter, search, search-history
  send-hiring-request, hiring-negotiating/[orderId], hiring-stage/[orderId], receive-request/[orderId]
  end-order/[orderId], end-order-early/[orderId], rating/[orderId], report/[orderId]
  chat/[orderId], history/[orderId]
  charity/[charityId], charity-donate/[charityId]
  deposit, deposit-method, withdraw, withdraw-method, withdraw-amount, transactions, unactive-balance
  add-skill, update-skills, add-hour, update-hour, update-hours, update-hobbies, manage-hiring
  favorite-games, ratings/[userId], feedback, feedback-create, feedback/[feedbackId], report-comment
  statistics, policies, user-profile, personal-change-password
  behavior-history, blocked-users
```

## Notes

- Pages still consume the legacy models re-exported by `src/api/types.ts`; the v2 shapes appear only
  in `src/api/v2` and the services. New screens can use the generated Orval client directly.
- `ios/` and `android/` are produced by Expo CNG and are git-ignored — configure native behaviour in
  `app.json` and config plugins instead of editing them.
- The recommendation rail on Home uses the v2 `score` as a shared-game count, so it filters on
  `score > 0` and hides when no suggestion matches the hirer's hobbies and searches.

## License

MIT — see `LICENSE`. Student capstone project; verify third-party assets before commercial use.
