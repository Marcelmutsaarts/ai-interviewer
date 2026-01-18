import { test, expect } from '@playwright/test'

// IMPORTANT: The TEST_PASSWORD environment variable must be set to run these tests.
// Example: TEST_PASSWORD=yourpassword npx playwright test
if (!process.env.TEST_PASSWORD) {
  throw new Error('TEST_PASSWORD environment variable is required to run E2E tests')
}

test.describe('Authenticatie', () => {
  test('moet inloggen met geldige gegevens', async ({ page }) => {
    await page.goto('/')

    // Vul naam in
    await page.fill('input[name="name"]', 'TestBeheerder')
    // Vul wachtwoord in
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!)
    // Klik op inloggen
    await page.click('button[type="submit"]')

    // Controleer of we naar het dashboard zijn doorgestuurd
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welkom, TestBeheerder')).toBeVisible()
  })

  test('moet foutmelding tonen bij onjuist wachtwoord', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[name="name"]', 'TestBeheerder')
    await page.fill('input[type="password"]', 'foutwachtwoord')
    await page.click('button[type="submit"]')

    // Controleer of foutmelding wordt getoond
    await expect(page.locator('text=Onjuist wachtwoord')).toBeVisible()
  })

  test('moet validatie tonen bij te korte naam', async ({ page }) => {
    await page.goto('/')

    // Probeer in te loggen met te korte naam
    await page.fill('input[name="name"]', 'A')
    await page.fill('input[type="password"]', 'testpassword')

    // Submit zou geblokkeerd moeten zijn of foutmelding tonen
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })

  test('moet succesvol kunnen uitloggen', async ({ page }) => {
    // Eerst inloggen
    await page.goto('/')
    await page.fill('input[name="name"]', 'TestBeheerder')
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Uitloggen
    await page.click('text=Uitloggen')

    // Controleer of we teruggestuurd zijn naar de login pagina
    await expect(page).toHaveURL('/')
  })
})
