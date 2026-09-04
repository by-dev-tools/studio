import './shell.css'
import { useCallback, useEffect, useState } from 'react'
import { useHashRoute } from './useHashRoute'
import { Sidebar } from './Sidebar'
import { IndexView } from './IndexView'
import { BriefPage } from './BriefPage'
import { InfiniteCanvas } from './canvas/InfiniteCanvas'
import { FrameOverlay } from './FrameOverlay'
import { DocOverlay } from './DocOverlay'
import { viewById } from '../registry'
import type { Node } from './canvas/layout'
import type { Rect } from './canvas/useViewport'

import type { Origin } from './useFlip'

type Doc = { label: string; markdown: string; origin?: Origin }

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

  const project = path.startsWith('/p/') ? path.slice(3) : undefined

  const openFrame = (viewId: string, origin?: Origin) => {
    setFrameOrigin(origin)
    setFrame(viewId)
    const entry = viewById(viewId)
    if (entry) history.replaceState(null, '', `#/p/${entry.project}?v=${viewId}`)
  }
  const closeFrame = () => {
    setFrame(null)
    if (project) history.replaceState(null, '', `#/p/${project}`)
  }

  const onTree = useCallback((t: Node[]) => setTree(t), [])
  const onJump = (rect: Rect, id: string) => setFocus({ rect, token: `${id}:${performance.now()}` })

  return (
    <div className="app">
      <Sidebar activeProject={project} tree={project ? tree : []} onJump={onJump} />

      {/* Overlays live INSIDE main, so an expanded document covers the canvas
          and not the navigation — you keep the sense of where you are. */}
      <main className="main">
        {project ? (
          <InfiniteCanvas
            projectId={project}
            focusRect={focus?.rect}
            focusToken={focus?.token}
            onTree={onTree}
            onOpenFrame={openFrame}
            onOpenDoc={(label, markdown, origin) => setDoc({ label, markdown, origin })}
          />
        ) : (
          <div className="main-scroll">{path === '/brief' ? <BriefPage /> : <IndexView />}</div>
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
