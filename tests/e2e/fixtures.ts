/* eslint-disable import/export */
import {expect, test as base, type Page} from "@playwright/test";
import {getApp, getApps, initializeApp} from "firebase/app";
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  ref,
  remove,
  runTransaction,
  set,
  update
} from "firebase/database";
import {
  getApps as getAdminApps,
  initializeApp as initializeAdminApp
} from "firebase-admin/app";
import {getFirestore as getAdminFirestore} from "firebase-admin/firestore";

import type {
  Game,
  HostDisconnectSignal,
  HostLease,
  RoomLifecycleSnapshot
} from "interfaces";
import {firebaseConfig} from "resources/config";

import {authenticate} from "./auth.utils";

const TEST_DATABASE_URL =
  process.env.databaseURL ||
  process.env.DATABASE_URL ||
  "https://click-battle-mp-default-rtdb.firebaseio.com";
const TEST_PROJECT_ID = process.env.projectId || "click-battle-emulator";

const getTestDatabase = () => {
  const app =
    getApps().length === 0
      ? initializeApp({
          ...firebaseConfig,
          databaseURL: TEST_DATABASE_URL,
          projectId: firebaseConfig.projectId || TEST_PROJECT_ID
        })
      : getApp();
  const db = getDatabase(app, TEST_DATABASE_URL);

  try {
    connectDatabaseEmulator(db, "localhost", 9000);
  } catch {
    // Firebase only allows connecting each app instance to the emulator once.
  }

  return db;
};

const getTestAdminFirestore = () => {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  const app =
    getAdminApps().find(({name}) => name === "click-battle-e2e") ??
    initializeAdminApp({projectId: TEST_PROJECT_ID}, "click-battle-e2e");

  return getAdminFirestore(app);
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

  async setRawRoom(roomID: string, room: Partial<Game>) {
    await set(ref(getTestDatabase(), `games/${roomID}`), room);
  }

  async patchRoomLifecycle(roomID: string, lifecycle: RoomLifecycleSnapshot) {
    await update(ref(getTestDatabase(), `games/${roomID}`), lifecycle);
  }

  async getHostLease(roomID: string): Promise<HostLease | null> {
    const snapshot = await get(
      ref(getTestDatabase(), `games/${roomID}/hostLease`)
    );

    return snapshot.val() as HostLease | null;
  }

  async setHostLease(roomID: string, hostLease: HostLease | null) {
    await set(ref(getTestDatabase(), `games/${roomID}/hostLease`), hostLease);
  }

  async expireHostLease(roomID: string, ageMs = 91_000) {
    const hostLease = await this.getHostLease(roomID);

    if (!hostLease) {
      throw new Error(`Room ${roomID} does not have a host lease`);
    }

    await this.setHostLease(roomID, {
      ...hostLease,
      lastRenewedAt: Date.now() - ageMs
    });
  }

  async renewHostLease(roomID: string, renewedAt = Date.now()) {
    const hostLease = await this.getHostLease(roomID);

    if (!hostLease) {
      throw new Error(`Room ${roomID} does not have a host lease`);
    }

    await this.setHostLease(roomID, {
      ...hostLease,
      lastRenewedAt: renewedAt
    });
  }

  async replaceHostLeaseSession(roomID: string, sessionID: string) {
    const hostLease = await this.getHostLease(roomID);

    if (!hostLease) {
      throw new Error(`Room ${roomID} does not have a host lease`);
    }

    await this.setHostLease(roomID, {
      ...hostLease,
      sessionId: sessionID,
      claimedAt: Date.now(),
      lastRenewedAt: Date.now()
    });
  }

  async attemptLeaseRenewal(
    roomID: string,
    ownerID: string,
    sessionID: string
  ): Promise<boolean> {
    const result = await runTransaction(
      ref(getTestDatabase(), `games/${roomID}/hostLease`),
      (current: HostLease | null) => {
        if (!current) {
          return;
        }

        if (current.ownerId !== ownerID || current.sessionId !== sessionID) {
          return;
        }

        return {
          ...current,
          lastRenewedAt: Date.now()
        };
      },
      {applyLocally: false}
    );

    return result.committed;
  }

  async getDisconnectSignal(
    roomID: string,
    sessionID: string
  ): Promise<HostDisconnectSignal | null> {
    const snapshot = await get(
      ref(getTestDatabase(), `roomHostDisconnects/${roomID}/${sessionID}`)
    );

    return snapshot.val() as HostDisconnectSignal | null;
  }

  async setDisconnectSignal(
    roomID: string,
    sessionID: string,
    disconnectedAt: number
  ) {
    await set(
      ref(getTestDatabase(), `roomHostDisconnects/${roomID}/${sessionID}`),
      {
        disconnectedAt
      }
    );
  }

  async removeDisconnectSignals(roomID: string) {
    await remove(ref(getTestDatabase(), `roomHostDisconnects/${roomID}`));
  }

  async removeRoom(roomID: string) {
    await remove(ref(getTestDatabase(), `games/${roomID}`));
  }

  async hasRoomHistory(roomID: string) {
    const snapshot = await getTestAdminFirestore()
      .collection("rooms")
      .doc(roomID)
      .get();

    return snapshot.exists;
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
    const context = await browser.newContext();
    const hostPage = new HostPage(await context.newPage());
    await authenticate(hostPage.page, "host");
    await use(hostPage);
    await context.close();
  },
  userPage: async ({browser}, use) => {
    const context = await browser.newContext();
    const userPage = new UserPage(await context.newPage());
    await authenticate(userPage.page, "user");
    await use(userPage);
    await context.close();
  }
});
