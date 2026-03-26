import { test, expect } from '@playwright/test'

test.describe('staging smoke', () => {
  const apiOrigin =
    process.env.PLAYWRIGHT_API_ORIGIN ||
    'https://pageforge-api-staging.htahta103.workers.dev'

  test('api worker health returns JSON', async ({ request }) => {
    const res = await request.get(`${apiOrigin}/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toMatchObject({ status: 'ok' })
  })

  test('pages serves SPA bundle for /projects', async ({ page }) => {
    await page.goto('/projects')

    // If Pages deploy is misconfigured (wrong artifact, no SPA rewrite),
    // this will never appear and the test will fail with a clear signal.
    await expect(page.getByTestId('projects-create-form')).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByTestId('projects-name-input')).toBeVisible()
  })

  test('can create project + page + open editor (requires VITE_API_URL set at build)', async ({
    page,
  }) => {
    await page.goto('/projects')

    await expect(page.getByTestId('projects-create-form')).toBeVisible({
      timeout: 20_000,
    })

    const projectName = `E2E ${Date.now()}`
    await page.getByTestId('projects-name-input').fill(projectName)
    await page.getByTestId('projects-create-button').click()

    await expect(page.getByTestId('projects-list')).toBeVisible()
    await expect(page.getByText(projectName)).toBeVisible()

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
  })
})

