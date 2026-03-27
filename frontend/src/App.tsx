import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppHeader } from '@/AppHeader'
import { EditorScreen } from '@/editor/EditorScreen'
import { I18nProvider } from '@/i18n/context'
import { ProjectPagesPage } from '@/pages/ProjectPagesPage'
import { ProjectsPage } from '@/pages/ProjectsPage'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-page text-fg">
          <AppHeader />
          <main className="mx-auto max-w-6xl px-4 py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectPagesPage />} />
              <Route
                path="/projects/:projectId/pages/:pageId/edit"
                element={<EditorScreen />}
              />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </I18nProvider>
  )
}
