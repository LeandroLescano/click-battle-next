import {expect, test} from "@playwright/test";

test("runs a click speed test and records clicks", async ({page}) => {
  await page.goto("/click-speed-test");

  await expect(
    page.getByRole("heading", {
      name: "How many clicks can you make in 5 seconds?"
    })
  ).toBeVisible();

  await expect(page.getByRole("link", {name: "Click Battle"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Go Back!"})).toHaveCount(0);

  await page.getByTestId("click-speed-test-start").click();
  const clickButton = page.getByTestId("click-speed-test-button");
  await clickButton.click();
  await clickButton.click();
  await clickButton.click();

  await expect(page.getByText("3", {exact: true})).toBeVisible();
});
