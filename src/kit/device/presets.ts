/**
 * Device presets in LOGICAL POINTS — the units iOS layout actually uses, so a
 * prototype's numbers transfer to SwiftUI unchanged. Safe-area insets are the
 * real values, not approximations: a 44pt tap target near the bottom edge has
 * to clear the home indicator here exactly as it does on device.
 */
export type DeviceId =
  | 'iphone-16'
  | 'iphone-16-pro'
  | 'iphone-16-pro-max'
  | 'iphone-se'
  | 'ipad-mini'

export type DevicePreset = {
  id: DeviceId
  name: string
  /** Logical points. */
  width: number
  height: number
  safeTop: number
  safeBottom: number
  /** Device corner radius in points. */
  radius: number
  /** Dynamic Island devices only. */
  island: boolean
  homeIndicator: boolean
}

export const DEVICES: Record<DeviceId, DevicePreset> = {
  'iphone-16': {
    id: 'iphone-16',
    name: 'iPhone 16',
    width: 393,
    height: 852,
    safeTop: 59,
    safeBottom: 34,
    radius: 55,
    island: true,
    homeIndicator: true,
  },
  'iphone-16-pro': {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    width: 402,
    height: 874,
    safeTop: 62,
    safeBottom: 34,
    radius: 55,
    island: true,
    homeIndicator: true,
  },
  'iphone-16-pro-max': {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    width: 440,
    height: 956,
    safeTop: 62,
    safeBottom: 34,
    radius: 55,
    island: true,
    homeIndicator: true,
  },
  'iphone-se': {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    safeTop: 20,
    safeBottom: 0,
    radius: 0,
    island: false,
    homeIndicator: false,
  },
  'ipad-mini': {
    id: 'ipad-mini',
    name: 'iPad mini',
    width: 744,
    height: 1133,
    safeTop: 24,
    safeBottom: 20,
    radius: 32,
    island: false,
    homeIndicator: true,
  },
}

export const DEFAULT_DEVICE: DeviceId = 'iphone-16'

/**
 * Bezel thickness in points. Lives here rather than in CSS because the layout
 * box has to be computed from it in JS — two sources would drift, and the
 * symptom of drift is a screen that overflows its own device.
 */
export const BEZEL = 12

export function outerSize(preset: DevicePreset): { width: number; height: number } {
  return { width: preset.width + BEZEL * 2, height: preset.height + BEZEL * 2 }
}
