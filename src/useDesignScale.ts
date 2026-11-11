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
    // 가로·세로 모두 화면에 들어가도록(잘림 없이) 맞추고, 남는 쪽은 가운데로 놓는다
    const baseH = baseW * (852 / 393)
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0) return
      const kk = h > 0 ? Math.min(w / baseW, h / baseH) : w / baseW
      setK(kk)
      el.style.setProperty('--ox', `${Math.max(0, (w - baseW * kk) / 2)}px`)
      el.style.setProperty('--oy', `${h > 0 ? Math.max(0, (h - baseH * kk) / 2) : 0}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [baseW])

  return { ref, k }
}
