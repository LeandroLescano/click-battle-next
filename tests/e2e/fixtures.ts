/* eslint-disable import/export */
import {expect, test as base, type Page} from "@playwright/test";
import {getApp, getApps, initializeApp} from "firebase/app";
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  ref,
  set
} from "firebase/database";

import type {Game} from "interfaces";
import {firebaseConfig} from "resources/config";

import {authenticate} from "./auth.utils";

const TEST_DATABASE_URL =
  process.env.databaseURL ||
  process.env.DATABASE_URL ||
  "https://click-battle-mp-default-rtdb.firebaseio.com";

const getTestDatabase = () => {
  const app =
    getApps().length === 0
      ? initializeApp({...firebaseConfig, databaseURL: TEST_DATABASE_URL})
      : getApp();
  const db = getDatabase(app, TEST_DATABASE_URL);

  try {
    connectDatabaseEmulator(db, "localhost", 9000);
  } catch {
    // Firebase only allows connecting each app instance to the emulator once.
  }

  return db;
};

class GenericPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createRoom(options?: {
    password?: string;
    gameMode?: "classic-speed" | "reaction";
    roomName?: string;
  }): Promise<string> {
    if (options?.roomName) {
      await this.page
        .getByRole("textbox", {name: "Room name"})
        .fill(options.roomName);
    }

    if (options?.password) {
      await this.page
        .getByRole("textbox", {name: "Password"})
        .fill(options.password);
    }

    if (options?.gameMode) {
      await this.page
        .getByRole("combobox", {name: "Game mode"})
        .selectOption(options.gameMode);
    }

    const createButton = this.page.getByRole("button", {name: "Create game"});
    await expect(createButton).toBeVisible();
    await Promise.all([this.page.waitForURL(/\/game\//), createButton.click()]);

    const roomID = this.page.url().split("/").pop();

    return roomID || "";
  }

  async openRoomByName(roomName: string) {
    await this.page
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
  }

  async makeRoomLegacy(roomID: string) {
    const db = getTestDatabase();
    const roomRef = ref(db, `games/${roomID}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val();

    if (!room) {
      throw new Error(`Room ${roomID} not found`);
    }

    const {
      gameMode: _gameMode,
      modeSettings: _modeSettings,
      ...legacyRoom
    } = room;
    await set(roomRef, legacyRoom);
  }

  async getRoom(roomID: string): Promise<Game | null> {
    const db = getTestDatabase();
    const snapshot = await get(ref(db, `games/${roomID}`));

    return snapshot.val() as Game | null;
  }
}

class HostPage extends GenericPage {}

class UserPage extends GenericPage {}

type MyFixtures = {
  hostPage: HostPage;
  userPage: UserPage;
};

export * from "@playwright/test";
export const test = base.extend<MyFixtures>({
  hostPage: async ({browser}, use) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/host.json"
    });
    const hostPage = new HostPage(await context.newPage());
    await authenticate(hostPage.page, "host");
    await use(hostPage);
    await context.close();
  },
  userPage: async ({browser}, use) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json"
    });
    const userPage = new UserPage(await context.newPage());
    await authenticate(userPage.page, "user");
    await use(userPage);
    await context.close();
  }
});
