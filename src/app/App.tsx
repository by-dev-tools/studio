import './shell.css'
import { useCallback, useEffect, useState } from 'react'
import { useHashRoute } from './useHashRoute'
import { Sidebar } from './Sidebar'
import { IndexView } from './IndexView'
import { ProjectRoot } from './ProjectRoot'
import { BriefPage } from './BriefPage'
import { InfiniteCanvas } from './canvas/InfiniteCanvas'
import { FrameOverlay } from './FrameOverlay'
import { DocOverlay } from './DocOverlay'
import { canvasEntryById, viewById } from '../registry'
import type { Node } from './canvas/layout'
import type { Rect } from './canvas/useViewport'
import type { Origin } from './useFlip'

type Doc = { label: string; markdown: string; origin?: Origin }

/**
 * Three routes, and only the last is a working surface:
 *
 *   #/              every project
 *   #/p/<project>   every canvas in one project
 *   #/c/<canvas>    one feature's canvas
 *
 * The two indexes exist so a project with a dozen features does not become one
 * wall you have to hunt through.
 */
export function App() {
  const route = useHashRoute()
  const [frame, setFrame] = useState<string | null>(null)
  const [frameOrigin, setFrameOrigin] = useState<Origin | undefined>()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [tree, setTree] = useState<Node[]>([])
  const [focus, setFocus] = useState<{ rect: Rect; token: string } | null>(null)

  const [path, query] = route.split('?')
  const deepFrame = new URLSearchParams(query ?? '').get('v')
  useEffect(() => setFrame(deepFrame), [deepFrame])

  const canvasId = path.startsWith('/c/') ? path.slice(3) : undefined
  const projectId = path.startsWith('/p/')
    ? path.slice(3)
    : canvasId
      ? canvasEntryById(canvasId)?.project
      : undefined

  const openFrame = (viewId: string, origin?: Origin) => {
    setFrameOrigin(origin)
    setFrame(viewId)
    if (canvasId && viewById(viewId)) {
      history.replaceState(null, '', `#/c/${canvasId}?v=${viewId}`)
    }
  }
  const closeFrame = () => {
    setFrame(null)
    if (canvasId) history.replaceState(null, '', `#/c/${canvasId}`)
  }

  const onTree = useCallback((t: Node[]) => setTree(t), [])
  const onJump = (rect: Rect, id: string) => setFocus({ rect, token: `${id}:${performance.now()}` })
  const openDoc = (label: string, markdown: string, origin?: Origin) =>
    setDoc({ label, markdown, origin })

  return (
    <div className="app">
      <Sidebar
        activeProject={projectId}
        activeCanvas={canvasId}
        tree={canvasId ? tree : []}
        onJump={onJump}
      />

      {/* Overlays live INSIDE main, so an expanded document covers the canvas
          and not the navigation — you keep the sense of where you are. */}
      <main className="main">
        {canvasId ? (
          <InfiniteCanvas
            canvasId={canvasId}
            focusRect={focus?.rect}
            focusToken={focus?.token}
            onTree={onTree}
            onOpenFrame={openFrame}
            onOpenDoc={openDoc}
          />
        ) : (
          <div className="main-scroll">
            {path === '/brief' ? (
              <BriefPage />
            ) : projectId ? (
              <ProjectRoot id={projectId} onOpenDoc={openDoc} />
            ) : (
              <IndexView />
            )}
          </div>
        )}

        {frame && <FrameOverlay id={frame} origin={frameOrigin} onClose={closeFrame} />}
        {doc && (
          <DocOverlay
            label={doc.label}
            markdown={doc.markdown}
            origin={doc.origin}
            onClose={() => setDoc(null)}
          />
        )}
      </main>
    </div>
  )
}
