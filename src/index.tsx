/**
 * Application entry point (Cloudflare Pages Worker).
 *
 * Wiring:
 *   /api/*   → clinical decision-support API (Hono sub-app in src/api/routes.ts)
 *   /static/* → served directly as static assets by Cloudflare Pages
 *               (excluded from the Worker via the generated _routes.json)
 *   *        → server-rendered SPA shell which boots the React client bundle
 *               (src/client → public/static/app.js)
 *
 * The Worker itself is intentionally thin: all reasoning lives in src/engine,
 * all HTTP surface in src/api, and all UI in src/client.
 */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { api } from './api/routes'
import { renderIndex } from './shell'

const app = new Hono()

app.use('*', logger())

// Health check on the worker root namespace too (handy for uptime probes).
app.get('/healthz', (c) => c.json({ status: 'ok', service: 'symptom-sorter' }))

// Clinical API — mounted under /api
app.route('/api', api)

// SPA fallback: every other route returns the client shell so client-side
// navigation (Consultation / Reference / Sample Cases tabs) works on refresh.
app.get('*', (c) => c.html(renderIndex()))

export default app
