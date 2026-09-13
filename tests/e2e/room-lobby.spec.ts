import {expect, test} from "./fixtures";

const uniqueRoomName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

test.describe("Room lobby", () => {
  test("shows an invite prompt when the host needs more players", async ({
    hostPage
  }) => {
    const roomName = uniqueRoomName("shareable-lobby");

    await hostPage.createRoom({roomName, keepInvitePrompt: true});

    const prompt = hostPage.page.getByTestId("room-invite-prompt");

    await expect(prompt).toBeVisible();
    await expect(prompt.getByText(roomName)).toBeVisible();
    await expect(prompt.getByText("Classic Speed")).toBeVisible();
    await expect(prompt.getByText("1 / 2 players connected")).toBeVisible();
    await expect(
      prompt.getByRole("button", {name: "Invite friends"})
    ).toBeVisible();
    await expect(
      prompt.getByRole("button", {name: "Room settings"})
    ).toBeVisible();
  });

  test("shows the invite prompt for a Reaction Battle host who needs a player", async ({
    hostPage
  }) => {
    const roomName = uniqueRoomName("reaction-lobby");
    await hostPage.page.goto("/");
    const reactionMode = hostPage.page.getByTestId("home-mode-reaction");
    await reactionMode.click({force: true});
    await expect(reactionMode).toHaveAttribute("aria-checked", "true");
    const createButton = hostPage.page.getByRole("button", {
      name: "Create game"
    });
    await expect(createButton).toBeEnabled();
    await Promise.all([
      hostPage.page.waitForURL(/\/game\//),
      createButton.click()
    ]);

    const prompt = hostPage.page.getByTestId("room-invite-prompt");
    await expect(prompt).toBeVisible();
    await expect(prompt.getByText("Reaction Battle")).toBeVisible();
    await expect(prompt.getByText("1 / 2 players connected")).toBeVisible();
  });

  test("lets the host continue waiting without an invite prompt", async ({
    hostPage
  }) => {
    await hostPage.createRoom({
      roomName: uniqueRoomName("lobby-waiting"),
      keepInvitePrompt: true
    });

    const prompt = hostPage.page.getByTestId("room-invite-prompt");
    await prompt.getByRole("button", {name: "Continue waiting"}).click();

    await expect(prompt).toBeHidden();
  });

  test("lets the host switch the mode from the lobby before a match starts", async ({
    hostPage
  }) => {
    const roomID = await hostPage.createRoom({
      roomName: uniqueRoomName("lobby-mode-switch"),
      keepInvitePrompt: true
    });

    const prompt = hostPage.page.getByTestId("room-invite-prompt");
    await prompt.getByRole("button", {name: "Room settings"}).click();

    const sidebar = hostPage.page.locator("aside.sidebar");
    const timer = sidebar.getByRole("combobox", {name: "Timer"});
    const reactionMode = sidebar.getByRole("radio", {
      name: "Reaction Battle"
    });
    await expect(timer).toBeVisible();
    await expect(reactionMode).toHaveAttribute("aria-checked", "false");
    await reactionMode.click();
    await expect(timer).toBeHidden();
    await hostPage.page.getByRole("button", {name: "Save settings"}).click();

    await expect
      .poll(
        async () => {
          const room = await hostPage.getRoom(roomID);
          return {
            gameMode: room?.gameMode,
            modeSettings: room?.modeSettings
          };
        },
        {timeout: 7000}
      )
      .toEqual({
        gameMode: "reaction",
        modeSettings: {
          config: {windowMs: 1500},
          gameMode: "reaction"
        }
      });
  });

  test("opens room settings without leaving the invite prompt over the controls", async ({
    hostPage
  }) => {
    await hostPage.createRoom({
      roomName: uniqueRoomName("lobby-settings"),
      keepInvitePrompt: true
    });

    const prompt = hostPage.page.getByTestId("room-invite-prompt");
    await prompt.getByRole("button", {name: "Room settings"}).click();

    await expect(prompt).toBeHidden();
    const sidebar = hostPage.page.locator("aside.sidebar");
    await expect(sidebar).toBeVisible();
    const transition = await sidebar.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        property: styles.transitionProperty,
        willChange: styles.willChange
      };
    });
    expect(transition.property).toContain("transform");
    expect(transition.property).not.toContain("width");
    expect(transition.property).not.toContain("opacity");
    expect(transition.willChange).toContain("transform");
    await expect(
      hostPage.page.getByRole("button", {name: "Save settings"})
    ).toBeVisible();
  });
});
