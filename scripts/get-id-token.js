#!/usr/bin/env node
/*
Helper script to exchange a Firebase Custom Token for an ID Token.
Options:
  --uid <UID>                UID to mint a custom token for (uses /api/dev/mint-id-token)
  --custom-token <TOKEN>     If provided, skips minting and exchanges this custom token
  --api-key <API_KEY>        Firebase Web API Key (fallback: parsed from .env.local)
  --base-url <URL>           Base URL to your app (default: http://localhost:3000)

Examples:
  node scripts/get-id-token.js --uid cKql... --api-key YOUR_FIREBASE_WEB_API_KEY
  node scripts/get-id-token.js --custom-token eyJhbGci...
*/

const fs = require('node:fs')
const path = require('node:path')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--uid') out.uid = args[++i]
    else if (a === '--custom-token') out.customToken = args[++i]
    else if (a === '--api-key') out.apiKey = args[++i]
    else if (a === '--base-url') out.baseUrl = args[++i]
  }
  return out
}

function parseEnvLocalApiKey() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const raw = fs.readFileSync(envPath, 'utf8')
    const lines = raw.split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/^NEXT_PUBLIC_FIREBASE_API_KEY\s*=\s*(.+)$/)
      if (m) return m[1].trim().replace(/^"|^'|"$|'$/g, '')
    }
  } catch {}
  return undefined
}

async function mintCustomToken(baseUrl, uid) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/dev/mint-id-token`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Mint custom token failed: ${res.status} ${res.statusText} ${txt}`)
  }
  const data = await res.json()
  if (!data.customToken) throw new Error('No customToken in response')
  return data.customToken
}

async function exchangeCustomForIdToken(apiKey, customToken) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Exchange failed: ${res.status} ${res.statusText} ${JSON.stringify(data)}`)
  }
  if (!data.idToken) {
    throw new Error(`No idToken in response: ${JSON.stringify(data)}`)
  }
  return { idToken: data.idToken, expiresIn: data.expiresIn, refreshToken: data.refreshToken }
}

;(async () => {
  try {
    const { uid, customToken: provided, apiKey: cliKey, baseUrl: cliBase } = parseArgs()
    const baseUrl = cliBase || 'http://localhost:3000'

    let apiKey = cliKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || parseEnvLocalApiKey()
    if (!apiKey) throw new Error('Missing Firebase API key. Pass --api-key or set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local')

    let customToken = provided
    if (!customToken) {
      if (!uid) throw new Error('Missing --uid (or provide --custom-token).')
      customToken = await mintCustomToken(baseUrl, uid)
    }

    const { idToken, expiresIn } = await exchangeCustomForIdToken(apiKey, customToken)
    console.log('\nID_TOKEN=')
    console.log(idToken)
    console.log(`\nExpiresIn: ${expiresIn}s`)
  } catch (e) {
    console.error('Error:', e.message || e)
    process.exit(1)
  }
})()
