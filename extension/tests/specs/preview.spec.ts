// Preview specs — open a specific extension page in a fresh browser
// so you can click around. Best used with `KEEP_BROWSER=1` so the
// window stays open after the test finishes:
//   npm run test:e2e:keep -- --grep "preview: welcome"
//   npm run test:e2e:keep -- --grep "preview: premium"
//   npm run test:e2e:keep -- --grep "preview: settings"
import { test } from '../fixtures/extension';

test.describe('Preview', () => {
  test('preview: welcome (first-install) page', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(
      `chrome-extension://${extensionId}/src/welcome/welcome.html`,
    );
    await page.waitForLoadState('domcontentloaded');
  });

  test('preview: premium intro page', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(
      `chrome-extension://${extensionId}/src/premium/premium.html`,
    );
    await page.waitForLoadState('domcontentloaded');
  });

  test('preview: settings page', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(
      `chrome-extension://${extensionId}/src/settings/settings.html`,
    );
    await page.waitForLoadState('domcontentloaded');
  });
});
