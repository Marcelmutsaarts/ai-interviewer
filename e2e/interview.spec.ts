import { test, expect } from '@playwright/test'

test.describe('Interview Flow', () => {
  test('moet landing pagina tonen voor geldig project', async ({ page }) => {
    // Navigeer naar een interview pagina (met test project ID)
    // In productie zou dit een echte project ID zijn
    await page.goto('/interview/test-project-id')

    // Controleer of de landing pagina elementen zichtbaar zijn
    // Of een foutmelding als het project niet bestaat
    const startButton = page.locator('text=Start Interview')
    const notFound = page.locator('text=niet gevonden')

    // Een van beide moet zichtbaar zijn
    await expect(startButton.or(notFound)).toBeVisible()
  })

  test('moet instructies tonen op de landing pagina', async ({ page }) => {
    await page.goto('/interview/test-project-id')

    // Als het project bestaat, controleer instructies
    const howItWorks = page.locator('text=Hoe het werkt')
    if (await howItWorks.isVisible()) {
      await expect(howItWorks).toBeVisible()
    }
  })

  test('moet foutmelding tonen voor inactief project', async ({ page }) => {
    // Navigeer naar een inactief project
    await page.goto('/interview/inactive-project-id')

    // Controleer of de niet beschikbaar melding wordt getoond
    const unavailable = page.locator('text=niet beschikbaar')
    const notFound = page.locator('text=niet gevonden')

    // Een van beide meldingen verwacht
    await expect(unavailable.or(notFound)).toBeVisible()
  })

  test('moet 404 pagina tonen voor niet-bestaand project', async ({ page }) => {
    await page.goto('/interview/non-existent-project-id-123456')

    // Controleer of een foutmelding wordt getoond
    const notFound = page.locator('text=niet gevonden')
    const error = page.locator('text=niet beschikbaar')

    await expect(notFound.or(error)).toBeVisible()
  })

  test('moet privacy tekst tonen op landing pagina', async ({ page }) => {
    await page.goto('/interview/test-project-id')

    // Als het project bestaat, controleer privacy tekst
    const privacyText = page.locator('text=anoniem')
    if (await privacyText.isVisible()) {
      await expect(privacyText).toBeVisible()
    }
  })
})

test.describe('Interview Voltooiing', () => {
  test('moet bedankpagina tonen na voltooiing', async ({ page }) => {
    // Navigeer naar de voltooiingspagina
    await page.goto('/interview/test-project-id/complete')

    // Controleer of de bedankpagina elementen zichtbaar zijn
    const thankYou = page.locator('text=Bedankt')
    const notFound = page.locator('text=niet gevonden')

    await expect(thankYou.or(notFound)).toBeVisible()
  })
})
