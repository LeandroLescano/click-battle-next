/* eslint-disable @typescript-eslint/no-explicit-any */
import {readFileSync} from "fs";
import {Page} from "@playwright/test";

const URL_LOCAL = "http://localhost:3000";

export const authenticate = async (page: any, type: "user" | "host") => {
  await page.goto(URL_LOCAL);

  const auth = JSON.parse(readFileSync(`tests/.auth/${type}.json`, "utf-8"));
  const storedUsername =
    auth.origins[0].localStorage.find((storage: any) => storage.name === "user")
      ?.value ?? "";

  await page.evaluate(async (auth: any) => {
    const indexedDB = window.indexedDB;
    const localStorageAuth: any[] = auth.origins[0].localStorage;

    for (const storage of localStorageAuth) {
      const dbName = storage.name;
      localStorage.setItem(storage.name, storage.value);

      let dbData;
      try {
        dbData = JSON.parse(storage.value);
      } catch (e) {
        continue;
      }
      const tables = Object.keys(dbData);

      const db: IDBDatabase = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName as string);
        req.onsuccess = (event: any) => {
          resolve(event.target.result);
        };
        req.onupgradeneeded = (event: any) => {
          resolve(event.target.result);
        };
        req.onerror = (e) => {
          reject(e);
        };
        req.onblocked = (event: any) => {
          reject(event);
        };
      });

      for (const table of tables) {
        const transaction = db.transaction([table], "readwrite");
        const objectStore = transaction.objectStore(table);

        for (const key of Object.keys(dbData[table])) {
          const value = dbData[table][key];

          // Parse value in case of keyPath
          let parsedValue =
            typeof value !== "string" ? JSON.stringify(value) : value;
          try {
            parsedValue = JSON.parse(parsedValue);
          } catch (e) {
            // value type is not json, nothing to do
          }

          if (objectStore.keyPath != null) {
            objectStore.put(parsedValue);
          } else {
            objectStore.put(parsedValue, key);
          }
        }
      }
    }
  }, auth);

  // Firebase Auth reads the restored IndexedDB state during app bootstrap.
  // Reload once after seeding the browser storage so the home page hydrates
  // with the authenticated guest profile before tests interact with it.
  await page.reload({waitUntil: "networkidle"});

  const usernameInput = page.getByPlaceholder(/Username|Nombre de usuario/i);
  if (
    storedUsername &&
    (await usernameInput.isVisible({timeout: 2000}).catch(() => false))
  ) {
    await usernameInput.fill(storedUsername);
    await page.getByRole("button", {name: /Choose|Elegir/i}).click();
    await page.waitForLoadState("networkidle");
  }
};

const getAuthResponse = (page: Page) => {
  return page.waitForResponse(/identitytoolkit.googleapis/);
};

export const loginAsGuest = async (page: Page, name = "guestuser") => {
  await page.goto("/");

  await page.getByRole("button", {name: "Login as guest"}).click();

  await getAuthResponse(page);

  await page.getByPlaceholder("Username").fill(name);

  await page.click("text=Choose");
};
