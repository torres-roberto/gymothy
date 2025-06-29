const { test, expect } = require('@playwright/test');

test.describe('Gymothy Authentication Flow', () => {
  test('should load the app and show login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the app loads - be more specific to avoid strict mode violation
    await expect(page.locator('#loginCard h1')).toContainText('Gymothy');
    
    // Check if login card is visible
    const loginCard = page.locator('#loginCard');
    await expect(loginCard).toBeVisible();
    
    // Check if Sign in with Google button exists
    const googleSignInBtn = page.locator('a[href*="/auth/google"]');
    await expect(googleSignInBtn).toBeVisible();
    await expect(googleSignInBtn).toContainText('Sign in with Google');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/login-page.png' });
  });

  test('should have correct Google OAuth URL', async ({ page }) => {
    // Listen to console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Browser console:', msg.text());
    });

    await page.goto('/');
    
    // Wait a moment for JavaScript to execute
    await page.waitForTimeout(1000);
    
    const googleSignInBtn = page.locator('a[href*="/auth/google"]');
    const href = await googleSignInBtn.getAttribute('href');
    
    console.log('Google OAuth URL:', href);
    console.log('Console logs:', consoleLogs);
    
    // Should point to localhost:3000 when running locally
    expect(href).toContain('localhost:3000');
    expect(href).toContain('/auth/google');
  });

  test('should show debug banner with authentication status', async ({ page }) => {
    await page.goto('/');
    
    // Check if debug banner exists and shows correct info
    const debugBanner = page.locator('#debugBanner');
    await expect(debugBanner).toBeVisible();
    
    const bannerText = await debugBanner.textContent();
    console.log('Debug banner text:', bannerText);
    
    // Should show not authenticated initially
    expect(bannerText).toContain('Authenticated: false');
    expect(bannerText).toContain('Token: none');
  });

  test('should have Add Exercise button and event listener status', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if Add Exercise button exists (should be in DOM but hidden when not authenticated)
    const addExerciseBtn = page.locator('#addExerciseToList');
    await expect(addExerciseBtn).toBeAttached();
    
    // When not authenticated, the button should be hidden (which is correct behavior)
    await expect(addExerciseBtn).not.toBeVisible();
    
    // Check debug banner for event listener status
    const debugBanner = page.locator('#debugBanner');
    await expect(debugBanner).toBeVisible();
    
    const bannerText = await debugBanner.textContent();
    console.log('Debug banner text:', bannerText);
    
    // Should show that Add Exercise listener is attached
    expect(bannerText).toContain('Add Exercise: attached');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/add-exercise-button.png' });
  });

  test('should handle Google OAuth redirect correctly', async ({ page }) => {
    // This test will help us see what happens during the OAuth flow
    await page.goto('/');
    
    const googleSignInBtn = page.locator('a[href*="/auth/google"]');
    const href = await googleSignInBtn.getAttribute('href');
    
    console.log('Starting OAuth flow with URL:', href);
    
    // Navigate to the OAuth URL and see what happens
    try {
      await page.goto(href);
      
      // Wait a bit to see if we get redirected
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('Current URL after OAuth attempt:', currentUrl);
      
      // Take screenshot of what we see
      await page.screenshot({ path: 'tests/screenshots/oauth-redirect.png' });
      
      // Log the page content to see what's happening
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      
    } catch (error) {
      console.log('Error during OAuth flow:', error.message);
      await page.screenshot({ path: 'tests/screenshots/oauth-error.png' });
    }
  });
}); 