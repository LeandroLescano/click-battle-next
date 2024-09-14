/* eslint-disable @typescript-eslint/no-explicit-any */
import {test as setup, expect, Page} from "@playwright/test";

const hostFile = "tests/.auth/host.json";

setup("authenticate as guest host", async ({page}) => {
  // Perform authentication steps. Replace these actions with your own.
  console.log("Authenticate as Guest Host");
  await page.goto("/");
  await page.getByRole("button", {name: "Login as guest"}).click();

  await page.waitForResponse(/identitytoolkit.googleapis/);
  await page.getByPlaceholder("Username").fill("guesthost1");

  await page.click("text=Choose");

  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByText("Save my data")).toBeVisible();

  // Await to store localStorage username and some other stuff
  await page.waitForTimeout(5000);

  await evaluateIndexedDB(page);

  await page.context().storageState({path: hostFile});
});

const userFile = "tests/.auth/user.json";

setup("authenticate as guest user", async ({page}) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/");
  await page.getByRole("button", {name: "Login as guest"}).click();

  await page.waitForResponse(/identitytoolkit.googleapis/);
  await page.getByPlaceholder("Username").fill("guestuser1");

  await page.click("text=Choose");

  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByText("Save my data")).toBeVisible();

  // Await to store localStorage username and some other stuff
  await page.waitForTimeout(5000);

  await evaluateIndexedDB(page);

  await page.context().storageState({path: userFile});
});

const evaluateIndexedDB = async (page: Page) => {
  await page.evaluate(async () => {
    const indexedDB = window.indexedDB;
    const dbs = await indexedDB.databases();

    for (let dbIndex = 0; dbIndex < dbs.length; dbIndex++) {
      const dbInfo = dbs[dbIndex];
      const db: IDBDatabase = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbInfo.name as string, dbInfo.version);
        req.onsuccess = (event: any) => {
          resolve(event.target.result);
        };
        req.onupgradeneeded = (event: any) => {
          resolve(event.target.result);
        };
        req.onerror = (e) => {
          reject(e);
        };
      });

      const dbRes: {[k: string]: any} = {};

      for (
        let objectStorageIndex = 0;
        objectStorageIndex < db.objectStoreNames.length;
        objectStorageIndex++
      ) {
        const objectStorageName = db.objectStoreNames[objectStorageIndex];
        const objectStorageRes: {[k: string]: any} = {};

        // Open a transaction to access the firebaseLocalStorage object store
        const transaction = db.transaction([objectStorageName], "readonly");
        const objectStore = transaction.objectStore(objectStorageName);

        // Get all keys and values from the object store
        const getAllKeysRequest = objectStore.getAllKeys();
        const getAllValuesRequest = objectStore.getAll();

        const keys: any = await new Promise((resolve, reject) => {
          getAllKeysRequest.onsuccess = (event: any) => {
            resolve(event.target.result);
          };
          getAllKeysRequest.onerror = (e) => {
            reject(e);
          };
        });

        const values: any = await new Promise((resolve, reject) => {
          getAllValuesRequest.onsuccess = (event: any) => {
            resolve(event.target.result);
          };
          getAllValuesRequest.onerror = (e) => {
            reject(e);
          };
        });

        for (let i = 0; i < keys.length; i++) {
          objectStorageRes[keys[i]] = JSON.stringify(values[i]);
        }

        dbRes[objectStorageName] = objectStorageRes;
      }
      localStorage.setItem(db.name, JSON.stringify(dbRes));
    }
  });
};
