/**
 * Node-side engine entry used only by the validation harness
 * (scripts/test-engine.mjs). Bundles the engine + sample cases for execution
 * outside the Worker runtime.
 */

export { analyze } from '../src/engine/reasoner'
export { extractFeatures } from '../src/engine/features'
export { CONDITIONS } from '../src/engine/conditions'
export { KB } from '../src/engine/kb'
export { SAMPLE_CASES } from '../src/client/sampleCases'
