/* eslint-disable @typescript-eslint/no-explicit-any */
import {Page} from "@playwright/test";

const URL_LOCAL = "http://localhost:3000";

export const loginAsGuest = async (page: Page, name = "guestuser") => {
  await page.goto(URL_LOCAL, {waitUntil: "domcontentloaded"});

  const usernameInput = page.locator('input[placeholder="Username"]').last();
  await usernameInput.waitFor({state: "visible", timeout: 5000});
  await usernameInput.fill(name);
  await page.getByRole("button", {name: /Choose|Elegir/i}).click();
  await page.waitForTimeout(2000);
};

export const authenticate = async (page: any, type: "user" | "host") => {
  await loginAsGuest(page, type === "host" ? "guesthost1" : "guestuser1");
};
