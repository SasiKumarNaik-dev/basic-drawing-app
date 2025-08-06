
import React, { useRef, useEffect, useState } from 'react'
import { useStore, generateId } from '../store'

export default function Canvas({ selectedShapeType }) {
  const canvasRef = useRef()
  const [drawing, setDrawing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [resizeDir, setResizeDir] = useState(null)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [currentShape, setCurrentShape] = useState(null)

  const {
    shapes,
    selectedId,
    setSelected,
    addShape,
    updateShape,
  } = useStore()

  const HANDLE_SIZE = 8

  function drawResizeHandles(ctx, shape) {
    const { x, y, width = 0, height = 0 } = shape
    const corners = [
      { x: x - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
      { x: x + width - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
      { x: x - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 },
      { x: x + width - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 },
    ]
    ctx.fillStyle = 'blue'
    corners.forEach(pt => ctx.fillRect(pt.x, pt.y, HANDLE_SIZE, HANDLE_SIZE))
  }

  function getHandleUnderCursor(shape, mx, my) {
    const { x, y, width, height } = shape
    const pts = { nw: [x, y], ne: [x + width, y], sw: [x, y + height], se: [x + width, y + height] }
    for (let dir in pts) {
      const [hx, hy] = pts[dir]
      if (mx >= hx - HANDLE_SIZE && mx <= hx + HANDLE_SIZE &&
          my >= hy - HANDLE_SIZE && my <= hy + HANDLE_SIZE) {
        return dir
      }
    }
    return null
  }

  function isInsideShape(shape, mx, my) {
    if (shape.type === 'circle') {
      const dx = mx - shape.x, dy = my - shape.y
      return dx * dx + dy * dy <= (shape.radius || 0) ** 2
    } else if (shape.type === 'line') {
      const minX = Math.min(shape.x, shape.x + (shape.width || 0))
      const maxX = Math.max(shape.x, shape.x + (shape.width || 0))
      const minY = Math.min(shape.y, shape.y + (shape.height || 0))
      const maxY = Math.max(shape.y, shape.y + (shape.height || 0))
      return mx >= minX && mx <= maxX && my >= minY && my <= maxY
    } else if (shape.type === 'triangle') {
      const x1 = shape.x, y1 = shape.y
      const x2 = shape.x + shape.width, y2 = shape.y + shape.height
      const x3 = shape.x - shape.width, y3 = shape.y + shape.height
      const area = Math.abs((x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2))/2.0)
      const area1 = Math.abs((mx*(y2-y3)+x2*(y3-my)+x3*(my-y2))/2.0)
      const area2 = Math.abs((x1*(my-y3)+mx*(y3-y1)+x3*(y1-my))/2.0)
      const area3 = Math.abs((x1*(y2-my)+x2*(my-y1)+mx*(y1-y2))/2.0)
      return (area === area1 + area2 + area3)
    } else {
      return mx >= shape.x && mx <= shape.x + (shape.width || 0) &&
             my >= shape.y && my <= shape.y + (shape.height || 0)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    shapes.forEach(s => drawShape(ctx, s, s.id === selectedId))
    if (currentShape) drawShape(ctx, currentShape, false)
    if (selectedId) {
      const sel = shapes.find(s => s.id === selectedId)
      if (sel && ['rectangle', 'line', 'triangle'].includes(sel.type)) drawResizeHandles(ctx, sel)
    }
  }, [shapes, currentShape, selectedId])

  function drawShape(ctx, shape, isSelected) {
    ctx.beginPath()
    ctx.fillStyle = shape.fillColor || '#ff0000'
    ctx.strokeStyle = shape.strokeColor || '#000'
    ctx.lineWidth = shape.lineWidth || 2
    ctx.setLineDash(shape.lineDash || [])

    if (shape.type === 'rectangle') {
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
    } else if (shape.type === 'circle') {
      ctx.arc(shape.x, shape.y, shape.radius || 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (shape.type === 'line') {
      ctx.moveTo(shape.x, shape.y)
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
      ctx.stroke()
    } else if (shape.type === 'triangle') {
      ctx.moveTo(shape.x, shape.y)
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
      ctx.lineTo(shape.x - shape.width, shape.y + shape.height)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.closePath()
  }

  function setCursorState(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    let cur = 'crosshair'
    const sel = shapes.find(s => isInsideShape(s, mx, my))
    if (sel) {
      const h = getHandleUnderCursor(sel, mx, my)
      cur = h ? 'nwse-resize' : 'move'
    }
    canvasRef.current.style.cursor = cur
  }

  function handleMouseDown(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const sel = shapes.find(s => isInsideShape(s, mx, my))
    if (sel) {
      setSelected(sel.id)
      const h = getHandleUnderCursor(sel, mx, my)
      if (h) setResizeDir(h)
      else setDragging(true)
      setStart({ x: mx, y: my })
      return
    }
    setSelected(null)
    setDrawing(true)
    setStart({ x: mx, y: my })
    setCurrentShape({
      id: generateId(),
      type: selectedShapeType,
      x: mx, y: my,
      width: 0, height: 0, radius: 0,
      fillColor: '#ff0000',
      strokeColor: '#000000',
      lineDash: [],
    })
  }

  function handleMouseMove(e) {
    setCursorState(e)
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top

    if (resizeDir && selectedId) {
      const shape = shapes.find(s => s.id === selectedId)
      if (!shape) return

      let { x: sx, y: sy, width, height } = shape
      let nx = sx, ny = sy, nw = width, nh = height
      if (resizeDir === 'se')      { nw = mx - sx; nh = my - sy }
      else if (resizeDir === 'sw') { nx = mx; nw = sx + width - mx; nh = my - sy }
      else if (resizeDir === 'ne') { ny = my; nh = sy + height - my; nw = mx - sx }
      else if (resizeDir === 'nw') { nx = mx; ny = my; nw = sx + width - mx; nh = sy + height - my }
      updateShape(selectedId, { x: nx, y: ny, width: nw, height: nh })
      return
    }

    if (dragging && selectedId) {
      const dx = mx - start.x, dy = my - start.y
      const shape = shapes.find(s => s.id === selectedId)
      if (shape) updateShape(selectedId, { x: shape.x + dx, y: shape.y + dy })
      setStart({ x: mx, y: my })
      return
    }

    if (!drawing) return
    const dx = mx - start.x, dy = my - start.y
    if (currentShape) {
      const upd = { ...currentShape }
      if (selectedShapeType === 'rectangle' || selectedShapeType === 'line' || selectedShapeType === 'triangle') {
        upd.width = dx; upd.height = dy
      } else if (selectedShapeType === 'circle') {
        upd.radius = Math.hypot(dx, dy)
      }
      setCurrentShape(upd)
    }
  }

  function handleMouseUp() {
    if (resizeDir) { setResizeDir(null); return }
    if (dragging) { setDragging(false); return }
    if (drawing && currentShape) addShape(currentShape)
    setCurrentShape(null); setDrawing(false)
  }

  return (
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        style={{ border: '1px solid #ccc' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
  )
}
