export const paths = {
  home: '/',
  editor: '/editor',
  settings: '/settings',
  projectEditorBase: (projectId: string) => `/projects/${projectId}/editor`,
  projectEditor: (projectId: string, pageId: string) => `/projects/${projectId}/editor/${pageId}`,
} as const

