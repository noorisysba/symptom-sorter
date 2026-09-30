import { JSDOM } from 'jsdom'
import fs from 'node:fs'

const bundle = fs.readFileSync('public/static/app.js', 'utf8')
const calls = []
async function fakeFetch(url, opts = {}) {
  calls.push({ url, method: opts.method || 'GET', body: opts.body })
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
const errors = []
window.addEventListener('error', (e) => errors.push('window.error: ' + e.message))
console.error = (...a) => errors.push('console.error: ' + a.map(String).join(' ').slice(0, 300))

window.eval(bundle)
await new Promise((r) => setTimeout(r, 1200))

const doc = window.document
const q = (s) => doc.querySelector(s)
const setNativeValue = (el, val) => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
  setter.call(el, val)
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
  el.dispatchEvent(new window.Event('change', { bubbles: true }))
}
const submit = async () => {
  const form = q('form.consult')
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
  await new Promise((r) => setTimeout(r, 900))
}
const out = {}

// ---- TEST A: submit with EMPTY reason -> warning popup, NO diagnose call ----
const before = calls.filter((c) => c.url.includes('/api/diagnose')).length
await submit()
out.A_diagnoseCallsBeforeAfter = `${before} -> ${calls.filter((c) => c.url.includes('/api/diagnose')).length}`
out.A_warningModalShown = !!q('.modal-overlay')
out.A_warningTitle = q('.modal-bar.warn h3')?.textContent?.trim()
out.A_warningBodyHasNoInfo = /Reason for Consultation is required/.test(q('.modal-body')?.textContent || '')
out.A_warningText = (q('.modal-empty p')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
out.A_invalidFieldMarked = !!q('#rvis.invalid')
out.A_inlineWarning = !!q('.warn-inline')

// dismiss warning
q('.modal-bar.warn .modal-close').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
await new Promise((r) => setTimeout(r, 300))
out.A_dismissed = !q('.modal-overlay')

// ---- TEST B: fill reason + submit -> popup with analysis ----
setNativeValue(q('#rvis'), 'Cough and mild fever')
setNativeValue(q('#age'), '29')
setNativeValue(q('#chief'), 'Cough\nClear/white sputum\nMild fever\nSore throat')
setNativeValue(q('#dur'), '5 days')
await new Promise((r) => setTimeout(r, 200))
await submit()
out.B_diagnoseCalls = calls.filter((c) => c.url.includes('/api/diagnose')).length
out.B_modalOpen = !!q('.modal-overlay')
const body = q('.modal-body')?.textContent || ''
out.B_hasTriage = /Triage:/.test(body)
out.B_topDiagnosis = q('.dx-card.top .dx-title')?.textContent?.trim()
out.B_hasDifferential = /Likely diagnosis/.test(body)
out.B_hasAssessment = /Assessment summary/.test(body)
out.B_hasFeatures = /Detected clinical features/.test(body)
out.B_hasChapters = /Matching Symptom Sorter chapters/.test(body)
out.B_hasDisclaimer = /Decision-support only/.test(body)
out.B_confidenceShown = /relative likelihood/.test(body)
out.errors = errors
console.log(JSON.stringify(out, null, 2))
