import {test, expect} from "@playwright/test";
import {loginAsGuest} from "./utils";

test("Should navigate to ranking page", async ({page}) => {
  await loginAsGuest(page, "guesttest1");

  await page.click("text=Ranking");

  await expect(
    page.getByRole("heading", {name: "Click masters"})
  ).toBeVisible();
});

test("Should go to 404 page on missing route and back to home", async ({
  page
}) => {
  await page.goto("/missing-route");

  await expect(page.getByText("404")).toBeVisible();

  await page.getByRole("button", {name: "Back to home"}).click();

  await page.waitForURL("http://localhost:3000/");

  expect(page.url()).toContain("http://localhost:3000/");
});
