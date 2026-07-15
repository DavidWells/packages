// ESM shim over the CJS slugger module
import sluggerModule from './slugger.js'

export const { makeSlug, slugifyText, smartSlugger } = sluggerModule
