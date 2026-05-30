// Node.js module loader hook — intercepts 'canvas' imports and returns the JS shim
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHIM_URL = pathToFileURL(join(__dirname, 'canvas-shim.mjs')).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'canvas') {
    return { shortCircuit: true, url: SHIM_URL };
  }
  return nextResolve(specifier, context);
}
