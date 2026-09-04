import './lockscreen.css'
import type { ReactNode } from 'react'

export function LockScreen({
  date = 'Wednesday, 26 August',
  time = '9:41',
  children,
}: {
  date?: string
  time?: string
  children?: ReactNode
}) {
  return (
    <div className="ls">
      <div className="ls-clock">
        <div className="ls-date">{date}</div>
        <div className="ls-time">{time}</div>
      </div>
      <div className="ls-stack">{children}</div>
    </div>
  )
}

export function Notification({
  app = 'App',
  icon = '🍐',
  title,
  message,
  when = 'now',
  actions,
  stacked,
}: {
  app?: string
  icon?: ReactNode
  title?: string
  message: ReactNode
  when?: string
  actions?: string[]
  /** Render the peeking card that says "more from this app". */
  stacked?: boolean
}) {
  return (
    <>
      <div className="ls-note">
        <div className="ls-note-body">
          <div className="ls-note-icon" aria-hidden>
            {icon}
          </div>
          <div className="ls-note-text">
            <div className="ls-note-head">
              <span className="ls-note-title">{title ?? app}</span>
              <span className="ls-note-when">{when}</span>
            </div>
            <div className="ls-note-msg">{message}</div>
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div className="ls-note-actions">
            {actions.map((a) => (
              <button key={a} className="ls-note-action">
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
      {stacked && <div className="ls-note-under" aria-hidden />}
    </>
  )
}
