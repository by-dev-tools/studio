import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../cx'
import { BEZEL, DEFAULT_DEVICE, DEVICES, outerSize, type DeviceId } from './presets'

export type PhoneProps = {
  device?: DeviceId
  mode?: 'light' | 'dark'
  /** Visual scale. Layout box shrinks with it, so canvases stay tidy. */
  scale?: number
  /** Frozen clock for the status bar — never `new Date()`, so frames are stable. */
  time?: string
  statusBar?: boolean
  island?: boolean
  homeIndicator?: boolean
  /** Caption rendered under the device, in studio chrome (never inside the screen). */
  label?: ReactNode
  /** Extra class on the screen — where a blueprint binds its token scope. */
  screenClassName?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * A phone-shaped rendering surface.
 *
 * Anything that is *page furniture* — a variant label, a mode switch, replay
 * controls — belongs OUTSIDE the screen. This gets learned the hard way:
 * a control rendered inside the phone reads as app
 * UI — that's what the phone frame is for"). `label` is the sanctioned place.
 */
export function Phone({
  device = DEFAULT_DEVICE,
  mode = 'light',
  scale = 1,
  time = '9:41',
  statusBar = true,
  island,
  homeIndicator,
  label,
  screenClassName,
  style,
  children,
}: PhoneProps) {
  const preset = DEVICES[device]
  const showIsland = island ?? preset.island
  const showHome = homeIndicator ?? preset.homeIndicator

  const outer = outerSize(preset)

  // Vars sit on the WRAPPER so the caption can read them too — it has to track
  // the scaled width, not the device's true width.
  const vars = {
    '--sd-w': `${preset.width}px`,
    '--sd-h': `${preset.height}px`,
    '--sd-bezel': `${BEZEL}px`,
    '--sd-radius': `${preset.radius || 8}px`,
    '--sd-safe-top': `${preset.safeTop}px`,
    '--sd-safe-bottom': `${preset.safeBottom}px`,
    '--sd-scale': scale,
    ...style,
  } as CSSProperties

  return (
    <div className="sd-device-wrap" style={vars}>
      <div
        className="sd-scale-box"
        style={{ width: outer.width * scale, height: outer.height * scale }}
      >
        <div className="sd-scale" style={{ width: outer.width, height: outer.height }}>
          <div className="sd-device" data-mode={mode}>
            <div
              className={cx('sd-screen', screenClassName)}
              data-mode={mode}
              data-pointer="coarse"
            >
              <div className="sd-screen-content">{children}</div>

              {statusBar && (
                <div className="sd-statusbar" aria-hidden>
                  <span className="sd-statusbar-time">{time}</span>
                  <span className="sd-statusbar-right">
                    <SignalGlyph />
                    <WifiGlyph />
                    <BatteryGlyph />
                  </span>
                </div>
              )}
              {showIsland && <div className="sd-island" aria-hidden />}
              {showHome && <div className="sd-home-indicator" aria-hidden />}
            </div>
          </div>
        </div>
      </div>
      {label && <div className="sd-device-label">{label}</div>}
    </div>
  )
}

function SignalGlyph() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
      <path d="M8.5 11.5 6.2 8.8a3.6 3.6 0 0 1 4.6 0L8.5 11.5Z" />
      <path
        d="M3.6 6.3a7.4 7.4 0 0 1 9.8 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1 3.2a11.3 11.3 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function BatteryGlyph() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
      <rect
        x="0.6"
        y="0.6"
        width="22"
        height="11.8"
        rx="3.6"
        stroke="currentColor"
        strokeOpacity="0.38"
        strokeWidth="1.1"
      />
      <rect x="2.4" y="2.4" width="15.5" height="8.2" rx="2.2" fill="currentColor" />
      <path
        d="M24.2 4.4v4.2a2.3 2.3 0 0 0 0-4.2Z"
        fill="currentColor"
        fillOpacity="0.42"
      />
    </svg>
  )
}
