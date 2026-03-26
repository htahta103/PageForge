import { useState } from 'react'
import { Editor } from './builder/Editor'
import { Toolbar } from './editor/Toolbar'
import { Canvas as LayoutLabCanvas } from './editor/Canvas'
import { useEditorStore as useLayoutLabStore } from './editor/store'

type AppMode = 'builder' | 'layout-lab'

function App() {
  const [appMode, setAppMode] = useState<AppMode>('builder')
  const layoutMode = useLayoutLabStore((s) => s.layoutMode)

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="border-b border-neutral-200 bg-white px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">PageForge</h1>
            <p className="text-sm text-neutral-600">Visual page builder</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={
                appMode === 'builder'
                  ? 'rounded-lg px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white'
                  : 'rounded-lg px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }
              onClick={() => setAppMode('builder')}
            >
              Builder
            </button>
            <button
              type="button"
              className={
                appMode === 'layout-lab'
                  ? 'rounded-lg px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white'
                  : 'rounded-lg px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }
              onClick={() => setAppMode('layout-lab')}
            >
              Layout modes
            </button>
          </div>
        </div>
      </header>

      {appMode === 'builder' ? (
        <Editor />
      ) : (
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Grid vs freeform</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Toggle layout modes on the prototype canvas (snapping and pixel placement).
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Current mode</div>
                <div className="font-semibold text-neutral-900">{layoutMode}</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Toolbar />
              <div className="text-xs text-neutral-500 shrink-0">
                {layoutMode === 'grid' ? 'Snaps to grid cells' : 'Pixel-precise freeform'}
              </div>
            </div>

            <LayoutLabCanvas />
          </div>
        </main>
      )}
    </div>
  )
}

export default App
