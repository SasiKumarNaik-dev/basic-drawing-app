import { create } from 'zustand'

export const useStore = create((set, get) => ({
  shapes: [],
  selectedId: null,

  addShape: (shape) => set((s) => ({ shapes: [...s.shapes, shape] })),
  setSelected: (id) => set({ selectedId: id }),
  updateShape: (id, updates) =>
    set((s) => ({
      shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...updates } : sh)),
    })),
  moveShape: (id, dx, dy) =>
    set((s) => ({
      shapes: s.shapes.map((sh) =>
        sh.id === id ? { ...sh, x: sh.x + dx, y: sh.y + dy } : sh
      ),
    })),
  saveDrawing: () => {
    const data = JSON.stringify(get().shapes)
    localStorage.setItem('drawing', data)
  },
  deleteShape: (id) =>
  set((s) => ({
    shapes: s.shapes.filter((shape) => shape.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
  })),
  loadDrawing: () => {
    const data = localStorage.getItem('drawing')
    if (data) set({ shapes: JSON.parse(data) })
  },
}))

export const generateId = () => Date.now().toString()


