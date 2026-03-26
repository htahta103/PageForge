import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { EditorPage } from '../pages/EditorPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SettingsPage } from '../pages/SettingsPage'
import { paths } from './paths'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: paths.home, element: <HomePage /> },
      { path: paths.editor, element: <EditorPage /> },
      { path: '/projects/:projectId/editor/:pageId', element: <EditorPage /> },
      { path: '/projects/:projectId/editor', element: <EditorPage /> },
      { path: paths.settings, element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

