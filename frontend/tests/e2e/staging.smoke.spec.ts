import { test, expect } from '@playwright/test'

test.describe('staging smoke', () => {
  const apiOrigin =
    process.env.PLAYWRIGHT_API_ORIGIN ||
    'https://pageforge-api-staging.htahta103.workers.dev'

  test('api worker health returns JSON', async ({ request }) => {
    // Fly backend exposes health at /api/v1/health (not /health).
    // Keep a small fallback for older staging setups.
    const primaryRes = await request.get(`${apiOrigin}/api/v1/health`)
    const res =
      primaryRes.status() === 404
        ? await request.get(`${apiOrigin}/health`)
        : primaryRes
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toMatchObject({ status: 'ok' })
  })

  test('pages serves SPA bundle for /projects', async ({ page }, testInfo) => {
    const consoleLines: string[] = []
    const pageErrors: string[] = []
    const failedRequests: string[] = []

    page.on('console', (msg) => {
      consoleLines.push(`[console.${msg.type()}] ${msg.text()}`)
    })
    page.on('pageerror', (err) => {
      pageErrors.push(`[pageerror] ${err.message}${err.stack ? `\n${err.stack}` : ''}`)
    })
    page.on('requestfailed', (req) => {
      const f = req.failure()
      failedRequests.push(
        `[requestfailed] ${req.method()} ${req.url()} ${f?.errorText ?? ''}`.trim(),
      )
    })

    try {
      await page.goto('/projects')

      // If Pages deploy is misconfigured (wrong artifact, no SPA rewrite),
      // this will never appear and the test will fail with a clear signal.
      await expect(page.getByTestId('projects-create-form')).toBeVisible({
        timeout: 20_000,
      })
      await expect(page.getByTestId('projects-name-input')).toBeVisible()
    } finally {
      await testInfo.attach('pages-console.log', {
        body: (consoleLines.join('\n') || '(no console logs)') + '\n',
        contentType: 'text/plain',
      })
      await testInfo.attach('pages-pageerrors.log', {
        body: (pageErrors.join('\n') || '(no page errors)') + '\n',
        contentType: 'text/plain',
      })
      await testInfo.attach('pages-requestfailed.log', {
        body: (failedRequests.join('\n') || '(no failed requests)') + '\n',
        contentType: 'text/plain',
      })
    }
  })

  test('can create project + page + open editor (requires VITE_API_URL set at build)', async (
    { page },
    testInfo,
  ) => {
    const consoleLines: string[] = []
    const pageErrors: string[] = []
    const failedRequests: string[] = []

    page.on('console', (msg) => {
      consoleLines.push(`[console.${msg.type()}] ${msg.text()}`)
    })
    page.on('pageerror', (err) => {
      pageErrors.push(`[pageerror] ${err.message}`)
    })
    page.on('requestfailed', (req) => {
      const f = req.failure()
      failedRequests.push(
        `[requestfailed] ${req.method()} ${req.url()} ${f?.errorText ?? ''}`.trim(),
      )
    })

    try {
      await page.goto('/projects')

      await expect(page.getByTestId('projects-create-form')).toBeVisible({
        timeout: 20_000,
      })

      const projectName = `E2E ${Date.now()}`
      await page.getByTestId('projects-name-input').fill(projectName)
      await page.getByTestId('projects-create-button').click()

      await expect(page.getByTestId('projects-list')).toBeVisible({
        timeout: 20_000,
      })
      await expect(page.getByText(projectName)).toBeVisible({ timeout: 20_000 })

      await page.getByRole('link', { name: 'Open' }).first().click()

      await expect(page.getByTestId('pages-create-form')).toBeVisible({
        timeout: 20_000,
      })

      const pageName = `Home ${Date.now()}`
      await page.getByTestId('pages-name-input').fill(pageName)
      await page.getByTestId('pages-create-button').click()

      await expect(page.getByTestId('pages-list')).toBeVisible()
      await expect(page.getByText(pageName)).toBeVisible()

      await page.getByRole('link', { name: 'Edit' }).first().click()

      await expect(page.getByTestId('editor-screen')).toBeVisible()
      await expect(page.getByTestId('editor-canvas')).toBeVisible()
      await expect(page.getByTestId('editor-save')).toBeVisible()
    } finally {
      await testInfo.attach('pages-console.log', {
        body: (consoleLines.join('\n') || '(no console logs)') + '\n',
        contentType: 'text/plain',
      })
      await testInfo.attach('pages-pageerrors.log', {
        body: (pageErrors.join('\n') || '(no page errors)') + '\n',
        contentType: 'text/plain',
      })
      await testInfo.attach('pages-requestfailed.log', {
        body: (failedRequests.join('\n') || '(no failed requests)') + '\n',
        contentType: 'text/plain',
      })
    }
  })
})

