import React from 'react'
import { useStore } from '../store'
import './control.css'

export default function Controls({ shapeType, setShapeType }) {
  const {
    selectedId,
    shapes,
    updateShape,
    deleteShape,
    saveDrawing,
    loadDrawing,
  } = useStore()

  const selected = shapes.find((s) => s.id === selectedId)

  return (
    <div className="controls">
      <div className="shape-selector">
        <label>Select Shape:</label>
        <button className={shapeType === 'rectangle' ? 'active' : ''} onClick={() => setShapeType('rectangle')}>🟥</button>
        <button className={shapeType === 'circle' ? 'active' : ''} onClick={() => setShapeType('circle')}>⚪</button>
        <button className={shapeType === 'line' ? 'active' : ''} onClick={() => setShapeType('line')}>\</button>
        <button className={shapeType === 'triangle' ? 'active' : ''} onClick={() => setShapeType('triangle')}>🔺</button>
      </div>

      {selected && (
        <>
        {shapeType !== 'line'
        && <div className="fill-color">
              <label>Fill Color:</label>
              <input
                type="color"
                value={selected.fillColor || '#ff0000'}
                onChange={(e) =>
                  updateShape(selectedId, { fillColor: e.target.value })
                }
              />
           </div>}
          <button className="delete" onClick={() => deleteShape(selectedId)}>🗑️ Delete Shape</button>
        </>
      )}

      <div className="action-buttons">
        <button className="save" onClick={saveDrawing}>Save</button>
        <button className="load" onClick={loadDrawing}>Load Last</button>
      </div>
    </div>
  )
}
