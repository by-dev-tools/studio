#!/usr/bin/env node
/**
 * The token boundary, enforced.
 *
 * A prototype that hardcodes a colour is lying about what the app looks like:
 * it will not follow the project's design language when that language changes,
 * and it will not translate back to production. So raw colour is legal in
 * exactly two places — a token declaration file, and platform chrome that
 * belongs to iOS rather than to any project.
 *
 * Run: npm run check:tokens
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

/**
 * Files permitted to declare raw colour, and why.
 *
 * `projects/<id>/data/` is the subtle one. Mock CONTENT may carry colour when
 * the real product derives that colour at runtime from content — album
 * album art is the worked example: axiom 2 says the artwork leads the colour,
 * so a record's accent is data, not a design token, and tokenising it would
 * misrepresent how the app works. This exemption covers mock content only. It
 * does not cover chrome: a colour that describes the app rather than the thing
 * being displayed belongs in tokens.css, wherever the file sits.
 */
const ALLOW = [
  ['src/index.css', 'studio shell token declarations'],
  ['tokens.css', 'a project token scope'],
  ['src/kit/device/device.css', 'iOS device chrome — bezel, not product colour'],
  ['src/kit/ios/lockscreen.css', 'iOS lock screen chrome — platform furniture'],
  [/(^|\/)data\//, 'mock content standing in for runtime-derived colour'],
]

// Both content roots. `workspace` is the private checkout; absent in a fresh clone.
const SCAN_DIRS = ['src', 'examples', 'workspace']
const SCAN_EXT = /\.(tsx|ts|css)$/

// #abc, #aabbcc, #aabbccdd — but not a CSS id selector or a URL fragment.
const HEX = /(?<![\w&#])#[0-9a-fA-F]{3,8}\b/g

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (SCAN_EXT.test(name)) yield full
  }
}

function allowed(rel) {
  return ALLOW.find(([pattern]) =>
    pattern instanceof RegExp ? pattern.test(rel) : rel === pattern || rel.endsWith('/' + pattern),
  )
}

const violations = []

for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir)
  try {
    statSync(abs)
  } catch {
    continue
  }
  for (const file of walk(abs)) {
    const rel = relative(ROOT, file)
    if (allowed(rel)) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      // A comment explaining a token's provenance may quote its value.
      if (/^\s*(\/\*|\*|\/\/)/.test(line)) return
      for (const match of line.matchAll(HEX)) {
        violations.push({ rel, line: i + 1, value: match[0], text: line.trim() })
      }
    })
  }
}

if (violations.length === 0) {
  console.log('✓ token boundary holds — no raw colour outside a token declaration')
  process.exit(0)
}

console.error(`✗ ${violations.length} raw colour value(s) outside a token declaration:\n`)
for (const v of violations) {
  console.error(`  ${v.rel}:${v.line}  ${v.value}`)
  console.error(`    ${v.text.slice(0, 100)}`)
}
console.error(`
Fix: add the value to the relevant token file and reference the custom property.
  · studio chrome        → src/index.css
  · a project's surface  → <root>/<project>/tokens.css
Raw colour is permitted only in:
${ALLOW.map(([p, why]) => `  · ${p instanceof RegExp ? p.source.replace(/\\/g, '') : p} — ${why}`).join('\n')}
`)
process.exit(1)
