import { useState } from 'react'
import { canvasEntriesFor, projects, statusLabel } from '../registry'
import type { Node } from './canvas/layout'
import type { Rect } from './canvas/useViewport'

/**
 * Collapsible rail with a nested tree.
 *
 * Nesting is the point: a project with six explorations, each holding three
 * sections, is fifty-odd navigable things. Flat, that is a wall; disclosed, the
 * top level stays four items long and you open only the branch you want.
 */
export function Sidebar({
  activeProject,
  activeCanvas,
  tree,
  onJump,
}: {
  activeProject?: string
  activeCanvas?: string
  tree: Node[]
  onJump: (rect: Rect, id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const open = !collapsed || hovered

  return (
    <aside
      className={`sb${collapsed ? ' is-collapsed' : ''}${open ? ' is-open' : ''}`}
      /**
       * Hover tracks pointer MOVEMENT, not entry.
       *
       * After clicking the toggle the pointer is still on the sidebar, so an
       * enter-based hover re-expands it instantly and the collapse is never
       * seen — all that appears to happen is the canvas shifting. Clearing
       * `hovered` on toggle and re-arming on the next move fixes that without
       * a suppression flag, which had a worse failure: it only cleared on
       * leave, so a toggle the pointer never left would disable peek for good.
       */
      onPointerMove={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sb-inner">
        <div className="sb-top">
          <a className="sb-brand" href="#/" title="Studio">
            <span className="sb-mark">S</span>
            <span className="sb-label">Studio</span>
          </a>
          <button
            className="sb-toggle"
            onClick={() => {
              setCollapsed((c) => !c)
              setHovered(false)
            }}
            aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
            aria-pressed={collapsed}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="2" y="3" width="12" height="10" rx="2" />
              <path d="M6.4 3v10" />
            </svg>
          </button>
        </div>

        <div className="sb-group">
          <div className="sb-group-label sb-label">Projects</div>
          {projects.map((p) => {
            const active = p.id === activeProject
            const status = statusLabel(p.status)
            return (
              <div key={p.id}>
                <a
                  className="sb-item"
                  href={`#/p/${p.id}`}
                  aria-current={active ? 'page' : undefined}
                  title={p.name}
                >
                  <span className="sb-avatar" style={{ background: p.accent ?? 'var(--ink-faint)' }}>
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="sb-item-name sb-label">{p.name}</span>
                </a>

                {/* An open project lists its canvases; the open canvas lists
                    its own sections beneath it. Two levels, so the rail shows
                    where you are without showing everything at once. */}
                {active && (
                  <div className="sb-tree sb-label">
                    {canvasEntriesFor(p.id).map((entry) => {
                      const open = entry.id === activeCanvas
                      return (
                        <div className="sb-node" key={entry.id}>
                          <div className="sb-nodeRow">
                            <span className="sb-twist is-leaf" aria-hidden />
                            <a
                              className="sb-nodeName"
                              href={`#/c/${entry.id}`}
                              aria-current={open ? 'page' : undefined}
                              title={entry.title}
                            >
                              {entry.title}
                            </a>
                          </div>
                          {open && tree.length > 0 && (
                            <div className="sb-children">
                              {tree.map((node) => (
                                <TreeNode key={node.id} node={node} depth={1} onJump={onJump} />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {status && <span className="sb-note">{status}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="sb-foot">
          <a className="sb-item sb-item-quiet" href="#/brief" title="Studio brief">
            <span className="sb-glyph">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M4 2.5h6.5L13 5v8.5H4z" strokeLinejoin="round" />
                <path d="M6 7h5M6 9.5h5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="sb-item-name sb-label">Studio brief</span>
          </a>
        </div>
      </div>
    </aside>
  )
}

function TreeNode({
  node,
  depth,
  onJump,
}: {
  node: Node
  depth: number
  onJump: (rect: Rect, id: string) => void
}) {
  // Top-level branches open; deeper ones stay shut so the tree cannot sprawl.
  const [open, setOpen] = useState(depth === 0)
  const branch = (node.children?.length ?? 0) > 0

  return (
    <div className="sb-node" style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
      <div className="sb-nodeRow">
        {branch ? (
          <button
            className={`sb-twist${open ? ' is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
            aria-expanded={open}
          />
        ) : (
          <span className="sb-twist is-leaf" aria-hidden />
        )}
        <button
          className={`sb-nodeName sb-kind-${node.kind}`}
          onClick={() => onJump(node.rect, node.id)}
          title={node.label}
        >
          {node.label}
        </button>
      </div>
      {branch && open && (
        <div className="sb-children">
          {node.children!.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} onJump={onJump} />
          ))}
        </div>
      )}
    </div>
  )
}
