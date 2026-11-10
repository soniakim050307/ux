import { useEffect, useState } from 'react'

/**
 * Phone tilt via DeviceOrientation.
 *  beta ≈ 0   → phone lying flat (face up)
 *  beta ≈ 90  → phone held upright
 * iOS Safari only delivers events after an explicit permission request,
 * which must happen inside a user gesture (e.g. a button tap).
 */
type DeviceOrientationCtor = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export async function requestTiltPermission(): Promise<boolean> {
  if (typeof DeviceOrientationEvent === 'undefined') return false
  const ctor = DeviceOrientationEvent as unknown as DeviceOrientationCtor
  if (typeof ctor.requestPermission === 'function') {
    try {
      return (await ctor.requestPermission()) === 'granted'
    } catch {
      return false
    }
  }
  return true
}

export function useTilt(enabled: boolean): number | null {
  const [beta, setBeta] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) return
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) setBeta(e.beta)
    }
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [enabled])
  return enabled ? beta : null
}

export const FLAT_BELOW = 35 // degrees → audio mode
export const UPRIGHT_ABOVE = 60 // degrees → camera mode
