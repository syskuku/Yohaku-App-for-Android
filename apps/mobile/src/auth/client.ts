import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'

import { apiBaseUrl } from '@/api/base-url'
import { secretStore } from '@/lib/secret-store'
import { site } from '@/site'

import { safeSessionCookie } from './session-cookie'

type AuthClient = ReturnType<typeof buildClient>

type ExpoClientPlugin = ReturnType<typeof expoClient>

const AUTH_SCHEME = site.scheme
const AUTH_ORIGIN = `${AUTH_SCHEME}://`
const RAW_COOKIE_KEY = 'yohaku_cookie_raw'

function buildClient(baseURL: string) {
  // better-auth 1.6.24+ ships a BetterFetch generic regression that makes the
  // expo plugin's getActions fail the BetterAuthClientPlugin contract at type
  // level (better-auth/better-auth#10515); runtime is unaffected. Widening
  // only getActions' parameters keeps the rest of the plugin type intact so
  // getCookie and route inference survive.
  const plugin = expoClient({
    scheme: AUTH_SCHEME,
    storagePrefix: 'yohaku',
    storage: secretStore,
  }) as Omit<ExpoClientPlugin, 'getActions'> & {
    getActions: (...args: any[]) => ReturnType<ExpoClientPlugin['getActions']>
  }

  return createAuthClient({
    baseURL,
    // Native fetch can send an Origin header directly. This also makes
    // cookie-bearing requests pass Better Auth's CSRF origin validation when
    // the server-side Expo hook cannot promote `expo-origin` early enough.
    fetchOptions: { headers: { origin: AUTH_ORIGIN }, timeout: 15_000 },
    plugins: [plugin],
  })
}

let cached: { baseURL: string; client: AuthClient } | null = null

// The API base URL can swap at runtime without reloading the app, so
// the client is memoized per baseURL instead of created once at module scope.
export function getAuthClient(): AuthClient {
  const baseURL = `${apiBaseUrl()}/auth`
  if (cached?.baseURL !== baseURL) {
    cached = { baseURL, client: buildClient(baseURL) }
  }
  return cached.client
}

export function getSessionCookie(): string {
  // Both sign-in paths write the plugin's cookie map (`yohaku_cookie`):
  // social via the Expo plugin, email via direct-auth's getSetCookie. Reading
  // the map first lets the social plugin's fresh write win; the raw value is a
  // fallback for devices where the plugin map is unavailable.
  const fromClient = safeSessionCookie(() => getAuthClient().getCookie())
  if (fromClient) return fromClient
  return safeSessionCookie(() => secretStore.getItem(RAW_COOKIE_KEY) ?? '')
}

export function setRawSessionCookie(cookie: string) {
  secretStore.setItem(RAW_COOKIE_KEY, cookie)
}

export function clearRawSessionCookie() {
  secretStore.deleteItem(RAW_COOKIE_KEY)
}
