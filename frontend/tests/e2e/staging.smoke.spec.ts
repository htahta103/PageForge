import { test, expect } from '@playwright/test'

test.describe('staging smoke', () => {
  test('projects list loads and can create project', async ({ page }) => {
    await page.goto('/projects')

    await expect(page.getByTestId('projects-create-form')).toBeVisible()
    await expect(page.getByTestId('projects-name-input')).toBeVisible()

    const name = `E2E ${Date.now()}`
    await page.getByTestId('projects-name-input').fill(name)
    await page.getByTestId('projects-create-button').click()

    await expect(page.getByTestId('projects-list')).toBeVisible()
    await expect(page.getByText(name)).toBeVisible()

    const open = page.getByRole('link', { name: 'Open' }).first()
    await open.click()

    await expect(page.getByTestId('pages-create-form')).toBeVisible()
  })

  test('create page and open editor', async ({ page }) => {
    await page.goto('/projects')

    const name = `E2E ${Date.now()}`
    await page.getByTestId('projects-name-input').fill(name)
    await page.getByTestId('projects-create-button').click()
    await expect(page.getByText(name)).toBeVisible()

    await page.getByRole('link', { name: 'Open' }).first().click()

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

