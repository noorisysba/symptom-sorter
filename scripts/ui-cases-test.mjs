import { JSDOM } from 'jsdom'
import fs from 'node:fs'
const bundle = fs.readFileSync('public/static/app.js', 'utf8')
const calls = []
async function fakeFetch(url, opts = {}) {
  calls.push({ url, method: opts.method || 'GET' })
  const full = url.startsWith('http') ? url : 'http://localhost:3000' + url
  const r = await fetch(full, opts)
  const text = await r.text()
  return { ok: r.ok, status: r.status, json: async () => JSON.parse(text), text: async () => text }
}
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`,
  { url: 'http://localhost:3000/', runScripts: 'outside-only', pretendToBeVisual: true })
const { window } = dom
window.fetch = fakeFetch
const errors = []
window.addEventListener('error', (e) => errors.push('window.error: ' + e.message))
console.error = (...a) => errors.push('console.error: ' + a.map(String).join(' ').slice(0, 200))
window.eval(bundle)
await new Promise((r) => setTimeout(r, 1200))
const doc = window.document
const q = (s) => doc.querySelector(s)
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
const all = (s) => [...doc.querySelectorAll(s)]

// go to Sample Cases tab (3rd subtab button)
click(all('.subtabs button')[2])
await new Promise((r) => setTimeout(r, 300))
const cards = all('.dx-card')
console.log('sample case cards:', cards.length)

const results = []
for (let i = 0; i < cards.length; i++) {
  // re-query cards each loop (DOM re-renders)
  const card = all('.dx-card')[i]
  click(card.querySelector('.btn-add'))
  await new Promise((r) => setTimeout(r, 900))
  const body = q('.modal-body')?.textContent || ''
  results.push({
    case: card.querySelector('.dx-title')?.textContent?.trim(),
    modalOpen: !!q('.modal-overlay'),
    top: q('.dx-card.top .dx-title')?.textContent?.trim(),
    triage: (q('.triage h4')?.textContent || '').replace(/\s+/g, ' ').trim(),
    hasDx: /Likely diagnosis/.test(body),
    hasTriage: /Triage:/.test(body),
  })
  // close modal
  click(q('.modal-close'))
  await new Promise((r) => setTimeout(r, 250))
  // back to cases tab (modal close doesn't change tab, but ensure)
}
console.log(JSON.stringify(results, null, 2))
console.log('diagnose calls:', calls.filter((c) => c.url.includes('/api/diagnose')).length)
console.log('errors:', JSON.stringify(errors))
