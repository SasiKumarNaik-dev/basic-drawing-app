import React, { useState } from 'react'
import Canvas from './components/Canvas'
import Controls from './components/Controls'

function App() {
  const [shapeType, setShapeType] = useState('rectangle')

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Drawing App</h2>
      <Controls shapeType={shapeType} setShapeType={setShapeType} />
      <Canvas selectedShapeType={shapeType} />
    </div>
  )
}

export default App
