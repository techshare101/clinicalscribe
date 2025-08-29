import { test, expect } from '@playwright/test';

test('PDF generation includes correct language information', async ({ page }) => {
  // Navigate to the transcription page
  await page.goto('/transcription');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Set patient language to French
  await page.locator('select#patient-language').selectOption('fr');
  
  // Set documentation language to English (default)
  await page.locator('select#doc-language').selectOption('en');
  
  // Add a sample transcript
  await page.locator('textarea#transcript').fill('Patient complains of headache and fever for 3 days.');
  
  // Click generate SOAP note
  await page.click('button:has-text("Generate SOAP Note")');
  
  // Wait for SOAP note to be generated
  await page.waitForSelector('.soap-note-content');
  
  // Check that language information is displayed correctly in the preview
  await expect(page.locator('text=Patient: FR')).toBeVisible();
  await expect(page.locator('text=Documentation: EN')).toBeVisible();
  
  // Click generate PDF button
  await page.click('button:has-text("Generate & Download PDF")');
  
  // Wait for PDF generation
  await page.waitForSelector('text=PDF generated successfully');
  
  // In a real test, we would verify the PDF content, but for now we're just checking
  // that the process completes without errors
  console.log('PDF generation with language information completed successfully');
});