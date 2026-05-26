import {test, expect} from "./fixtures";

test("Should change language to spanish", async ({userPage: {page}}) => {
  await expect(page.getByText("Log Out")).toBeVisible();
  await page.getByRole("button", {name: "Profile"}).click();

  await page.getByRole("button", {name: /^en flag en$/i}).click();
  await page.getByRole("menuitem", {name: "es"}).click();

  await expect(page.getByText("Salas disponibles")).toBeVisible();
});

test("Should change language to portuguese", async ({userPage: {page}}) => {
  await expect(page.getByText("Log Out")).toBeVisible();
  await page.getByRole("button", {name: "Profile"}).click();

  await page.getByRole("button", {name: /^en flag en$/i}).click();
  await page.getByRole("menuitem", {name: "pr"}).click();

  await expect(page.getByText("Salas disponíveis")).toBeVisible();
});
