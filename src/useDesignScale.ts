import { useEffect, useRef, useState } from 'react'

/** Figma 프레임 너비. 화면 너비에 맞춰 이 크기의 "디자인 캔버스"를 비율대로 확대한다. */
export const DESIGN_W = 368
export const DESIGN_H = 799

export function useDesignScale<T extends HTMLElement>(baseW: number = DESIGN_W) {
  const ref = useRef<T | null>(null)
  const [k, setK] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setK(el.clientWidth / baseW)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [baseW])

  return { ref, k }
}
