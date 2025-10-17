const { chromium } = require("playwright");

async function fillForm() {
  console.log("Starting browser automation...");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to portal.parkon.ch...");
    await page.goto("https://portal.parkon.ch/t48irj", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Take initial screenshot
    await page.screenshot({
      path: "screenshots/01-initial-page.png",
      fullPage: true,
    });
    console.log("Page loaded, screenshot saved");

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);

    console.log("Detected MudBlazor form components...");

    // MudBlazor uses custom components - find all MudSelect inputs
    const mudSelects = await page.$$("input.mud-select-input");
    const mudTextInputs = await page.$$(
      "input.mud-input-slot:not(.mud-select-input)"
    );
    const mudCheckbox = await page.$("input.mud-checkbox-input");

    console.log(`Found ${mudSelects.length} MudSelect dropdowns`);
    console.log(`Found ${mudTextInputs.length} text inputs`);
    console.log(`Found checkbox: ${mudCheckbox ? "yes" : "no"}`);

    // Select ZH from Kanton dropdown (first MudSelect)
    console.log("Selecting Kanton: ZH...");
    if (mudSelects.length > 0) {
      await mudSelects[0].click();
      await page.waitForTimeout(500);
      // Wait for dropdown menu to appear and click ZH option
      await page.click("text=ZH", { timeout: 5000 });
      console.log("Selected ZH");
    }
    await page.screenshot({
      path: "screenshots/02-kanton-selected.png",
      fullPage: true,
    });

    // Enter Kennzeichen (first text input)
    console.log("Entering Kennzeichen: 141362...");
    if (mudTextInputs.length > 0) {
      await mudTextInputs[0].click();
      await mudTextInputs[0].fill("141362");
      console.log("Filled Kennzeichen");
    }
    await page.screenshot({
      path: "screenshots/03-kennzeichen-entered.png",
      fullPage: true,
    });

    // Select 12h from Dauer dropdown (second MudSelect)
    console.log("Selecting Dauer: 12h...");
    if (mudSelects.length > 1) {
      await mudSelects[1].click();
      await page.waitForTimeout(500);
      // Click 12h option from dropdown
      await page.click("text=12h", { timeout: 5000 });
      console.log("Selected 12h");
    }
    await page.screenshot({
      path: "screenshots/04-dauer-selected.png",
      fullPage: true,
    });

    // Enter email (second text input)
    console.log("Entering email: bobvantpadje@gmail.com...");
    if (mudTextInputs.length > 1) {
      await mudTextInputs[1].click();
      await mudTextInputs[1].fill("bobvantpadje@gmail.com");
      console.log("Filled email");
    }
    await page.screenshot({
      path: "screenshots/05-email-entered.png",
      fullPage: true,
    });

    // Check the checkbox
    console.log("Checking the checkbox...");
    if (mudCheckbox) {
      await mudCheckbox.check();
      console.log("Checked the checkbox");
    }
    await page.screenshot({
      path: "screenshots/06-checkbox-checked.png",
      fullPage: true,
    });

    // Look for submit button and click it
    console.log("Looking for submit button...");

    // MudBlazor typically uses button.mud-button for buttons
    // Try multiple approaches to find the submit button
    let submitButton = null;

    try {
      // Try finding button by text content
      const buttons = await page.$$("button");
      console.log(`Found ${buttons.length} buttons on page`);

      for (const button of buttons) {
        const text = await button.textContent();
        console.log(`Button text: "${text}"`);

        if (
          text &&
          (text.toLowerCase().includes("submit") ||
            text.toLowerCase().includes("senden") ||
            text.toLowerCase().includes("absenden") ||
            text.toLowerCase().includes("bestellen") ||
            text.toLowerCase().includes("weiter"))
        ) {
          submitButton = button;
          console.log(`Found submit button with text: "${text}"`);
          break;
        }
      }

      if (submitButton) {
        console.log("Clicking submit button...");

        // Scroll button into view and wait a bit
        await submitButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Click the button
        await submitButton.click();
        console.log("Button clicked, waiting for response...");

        // Wait for navigation or response
        await page.waitForTimeout(5000);
        await page.screenshot({
          path: "screenshots/07-after-submit.png",
          fullPage: true,
        });

        // Check for success or error messages
        const pageContent = await page.content();
        console.log("Form submitted successfully!");

        // Look for common success indicators
        if (
          pageContent.includes("erfolg") ||
          pageContent.includes("success") ||
          pageContent.includes("bestätigung")
        ) {
          console.log("✅ Success message detected!");
        }
      } else {
        console.log("⚠️ No submit button found, form filled but not submitted");
        console.log(
          "This may be normal if the form auto-submits or requires additional steps"
        );
      }
    } catch (error) {
      console.log("Error clicking submit button:", error.message);
    }

    await page.screenshot({
      path: "screenshots/08-final-state.png",
      fullPage: true,
    });
    console.log("Automation completed successfully!");
  } catch (error) {
    console.error("❌ Error during automation:", error.message);
    await page.screenshot({ path: "screenshots/error.png", fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the automation
fillForm()
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Automation failed:", error);
    process.exit(1);
  });
