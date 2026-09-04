#!/usr/bin/env node
/**
 * Derives the temporal layer. Two sources, neither hand-maintained:
 *
 *   · WHEN — `git log` over each exploration's folder. A hand-written "updated"
 *     field goes stale the first time someone forgets it, and a stale date is
 *     worse than no date because it is believed.
 *   · WHETHER IT SHIPPED — the PRs an exploration declares in exploration.json,
 *     enriched through `gh`. The link is declared rather than guessed: inferring
 *     it from slugs appearing in PR text would be confidently wrong sometimes,
 *     and this is the field people will trust most.
 *
 * Writes src/generated/activity.json, which is gitignored — it is a cache, and
 * the app renders correctly without it. Runs automatically before dev and build.
 *
 * DEGRADES, never fails: no git, no gh, not logged in, or offline all produce a
 * file that says so rather than breaking the build.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT_DIR = join(ROOT, 'src/generated')
const OUT = join(OUT_DIR, 'activity.json')

function sh(cmd, args, cwd = ROOT) {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

/** Every exploration directory, across both content roots. */
function findExplorations() {
  return [...workspaceExplorations(), ...exampleExplorations()]
}

/** examples/<project>/contributors/<who>/<slug> */
function exampleExplorations() {
  const base = join(ROOT, 'examples')
  if (!existsSync(base)) return []
  const out = []
  for (const project of readdirSync(base)) {
    const cdir = join(base, project, 'contributors')
    if (!existsSync(cdir)) continue
    for (const who of readdirSync(cdir)) {
      const whoDir = join(cdir, who)
      if (!statSync(whoDir).isDirectory()) continue
      for (const slug of readdirSync(whoDir)) {
        const dir = join(whoDir, slug)
        if (!statSync(dir).isDirectory()) continue
        out.push({ id: `${who}/${project}/${slug}`, dir })
      }
    }
  }
  return out
}

/** workspace/contributors/<who>/<project>/<slug> */
function workspaceExplorations() {
  const base = join(ROOT, 'workspace/contributors')
  if (!existsSync(base)) return []
  const out = []
  for (const who of readdirSync(base)) {
    const whoDir = join(base, who)
    if (!statSync(whoDir).isDirectory()) continue
    for (const project of readdirSync(whoDir)) {
      const projDir = join(whoDir, project)
      if (!statSync(projDir).isDirectory()) continue
      for (const slug of readdirSync(projDir)) {
        const dir = join(projDir, slug)
        if (!statSync(dir).isDirectory()) continue
        out.push({ id: `${who}/${project}/${slug}`, dir })
      }
    }
  }
  return out
}

function gitActivity(dir) {
  const rel = relative(ROOT, dir)
  const dates = sh('git', ['log', '--format=%aI', '--', rel])
  if (!dates) return null
  const list = dates.split('\n').filter(Boolean)
  return { started: list.at(-1) ?? null, updated: list[0] ?? null, commits: list.length }
}

/** "owner/repo#42" or a full PR URL → { owner, repo, number } */
function parsePrRef(ref) {
  const url = ref.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (url) return { owner: url[1], repo: url[2], number: Number(url[3]) }
  const short = ref.match(/^([^/\s]+)\/([^#\s]+)#(\d+)$/)
  if (short) return { owner: short[1], repo: short[2], number: Number(short[3]) }
  return null
}

function fetchPr(ref) {
  const parsed = parsePrRef(ref)
  if (!parsed) return { ref, error: 'unparseable reference' }
  const raw = sh('gh', [
    'pr', 'view', String(parsed.number),
    '--repo', `${parsed.owner}/${parsed.repo}`,
    '--json', 'number,title,state,url,mergedAt,updatedAt,isDraft',
  ])
  if (!raw) return { ref, error: 'not reachable — gh missing, unauthenticated, or offline' }
  try {
    const pr = JSON.parse(raw)
    return {
      ref,
      number: pr.number,
      title: pr.title,
      state: pr.isDraft && pr.state === 'OPEN' ? 'DRAFT' : pr.state,
      url: pr.url,
      mergedAt: pr.mergedAt ?? null,
      updatedAt: pr.updatedAt ?? null,
    }
  } catch {
    return { ref, error: 'unreadable response' }
  }
}

const ghReady = sh('gh', ['auth', 'status']) !== null

const explorations = {}
for (const { id, dir } of findExplorations()) {
  const metaPath = join(dir, 'exploration.json')
  let meta = {}
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    } catch {
      console.warn(`  ! ${id}: exploration.json is not valid JSON — ignoring it`)
    }
  }

  const refs = Array.isArray(meta.pr) ? meta.pr : meta.pr ? [meta.pr] : []
  const prs = ghReady ? refs.map(fetchPr) : refs.map((ref) => ({ ref, error: 'gh unavailable' }))

  explorations[id] = { ...gitActivity(dir), prs }
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(
  OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      git: sh('git', ['rev-parse', '--short', 'HEAD']) !== null,
      gh: ghReady,
      explorations,
    },
    null,
    2,
  ) + '\n',
)

const withPrs = Object.values(explorations).filter((e) => e.prs.length > 0).length
console.log(
  `✓ activity synced — ${Object.keys(explorations).length} exploration(s), ${withPrs} with PR links` +
    (ghReady ? '' : ' (gh unavailable; PR state skipped)'),
)
