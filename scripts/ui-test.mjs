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

const dom = new JSDOM(
  `<!DOCTYPE html><html><head><title>t</title></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost:3000/', runScripts: 'outside-only', pretendToBeVisual: true }
)
const { window } = dom
window.fetch = fakeFetch
window.IS_REACT_ACT_ENVIRONMENT = false

const errors = []
window.addEventListener('error', (e) => errors.push('window.error: ' + e.message))
console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 300)) }

try { window.eval(bundle) } catch (e) { errors.push('EVAL THREW: ' + e.message) }
await new Promise((r) => setTimeout(r, 1500))

const doc = window.document
const q = (s) => doc.querySelector(s)
const report = {
  rootChildren: doc.getElementById('root').children.length,
  hasTopbar: !!q('.topbar'),
  hasLeftPanelStatic: !!q('.col-left'),
  hasMainRight: !!q('.col-main'),
  hasConsultForm: !!q('form.consult'),
  hasReasonSection: /Reason For Consultation/.test(doc.body.textContent),
  requiredMarkers: doc.querySelectorAll('.req').length,
  hasSubmit: !!q('.btn-submit'),
  hasClear: !!q('.btn-clear'),
  modalPresentInitially: !!q('.modal-overlay'),
  apiCalls: calls.map((c) => c.method + ' ' + c.url),
  errors,
}
console.log(JSON.stringify(report, null, 2))
