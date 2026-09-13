/* eslint-disable @typescript-eslint/no-explicit-any */
import {Page} from "@playwright/test";

export const loginAsGuest = async (page: Page, name = "guestuser") => {
  await page.goto("/", {waitUntil: "domcontentloaded"});

  const guestLogin = page.getByRole("button", {
    name: /Login as guest|Ingresar como invitado/i
  });

  if (await guestLogin.isVisible()) {
    await guestLogin.click();
  }

  const usernameInput = page.locator('input[placeholder="Username"]').last();
  await usernameInput.waitFor({state: "visible", timeout: 5000});
  await usernameInput.fill(name);
  await page.getByRole("button", {name: /Choose|Elegir/i}).click();
  await page.waitForTimeout(2000);
};

export const authenticate = async (page: any, type: "user" | "host") => {
  await loginAsGuest(page, type === "host" ? "guesthost1" : "guestuser1");
};
