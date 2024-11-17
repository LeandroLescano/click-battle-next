import {test, expect} from "./fixtures";

test.describe("Account", () => {
  test("Should open modal when Save My Data is clicked", async ({
    userPage: {page}
  }) => {
    await page.getByText("Save my data").click();

    await expect(page.getByRole("heading", {name: "Login with"})).toBeVisible();
  });
});
