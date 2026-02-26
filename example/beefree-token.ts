import type { IToken } from '@beefree.io/vue-email-builder'

/**
 * ************************************************************
 *                      !!!! WARNING !!!!
 *
 *  This is done on the frontend to get the example working.
 *  You must set up a backend server to perform the login.
 *  Otherwise, your credentials will be at risk!
 *
 *  See beefree-sdk-examples/secure-auth-example for a
 *  production-ready server implementation.
 *
 * ************************************************************
 */
const AUTH_URL = 'https://auth.getbee.io/loginV2'

export async function getBuilderToken(
  clientId: string,
  clientSecret: string,
  userId = 'user',
): Promise<IToken> {
  let response: Response
  try {
    response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        uid: userId,
      }),
    })
  } catch {
    throw new Error('Network error: unable to reach authentication server')
  }

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
  }

  const token = await response.json()

  if (!token || !token.access_token) {
    throw new Error('Invalid credentials: no access token returned')
  }

  return token
}
