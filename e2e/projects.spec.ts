import { test, expect } from '@playwright/test'

test.describe('Projecten', () => {
  test.beforeEach(async ({ page }) => {
    // Inloggen voor elke test
    await page.goto('/')
    await page.fill('input[name="name"]', 'TestBeheerder')
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('moet een nieuw project kunnen aanmaken', async ({ page }) => {
    // Klik op Nieuw Project
    await page.click('text=Nieuw Project')

    // Vul projectgegevens in
    await page.fill('input[id="project-name"]', 'Test Interview Project')
    await page.fill('textarea', 'Dit is een test project voor E2E tests')

    // Klik op aanmaken
    await page.click('text=Aanmaken & Configureren')

    // Controleer of we naar de configuratiepagina zijn doorgestuurd
    await expect(page).toHaveURL(/\/project\/.*\/configure/)
  })

  test('moet projecten in het overzicht tonen', async ({ page }) => {
    // Controleer of het projectoverzicht zichtbaar is
    await expect(page.locator('h1:has-text("Mijn Projecten")')).toBeVisible()

    // Controleer of de grid met projecten bestaat
    await expect(page.locator('.grid')).toBeVisible()
  })

  test('moet een project kunnen verwijderen', async ({ page }) => {
    // Vind de verwijderknop van het eerste project
    const deleteButton = page.locator('[aria-label="Verwijderen"]').first()

    // Als er projecten zijn, test verwijderen
    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Bevestig verwijdering in modal
      await page.click('text=Verwijderen')

      // Wacht op bevestiging
      await expect(page.locator('text=Project verwijderd')).toBeVisible()
    }
  })

  test('moet naar project sessies kunnen navigeren', async ({ page }) => {
    // Klik op Sessies knop van eerste project
    const sessiesButton = page.locator('text=Sessies').first()

    if (await sessiesButton.isVisible()) {
      await sessiesButton.click()

      // Controleer of we op de sessiepagina zijn
      await expect(page).toHaveURL(/\/project\/.*\/sessions/)
    }
  })

  test('moet naar project configuratie kunnen navigeren', async ({ page }) => {
    // Klik op Configuratie knop van eerste project
    const configButton = page.locator('text=Configuratie').first()

    if (await configButton.isVisible()) {
      await configButton.click()

      // Controleer of we op de configuratiepagina zijn
      await expect(page).toHaveURL(/\/project\/.*\/configure/)
    }
  })
})
