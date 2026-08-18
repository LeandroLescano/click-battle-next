import test from "node:test";
import {assertSucceeds} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, doc, firestore, setDoc, updateDoc} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());

test("authenticated clients retain the existing statistics persistence flow", async () => {
  await assertSucceeds(setDoc(doc(firestore("guest"), "rooms", "room-1"), {gamesPlayed: []}));
  await assertSucceeds(setDoc(doc(firestore("guest"), "reactionRankings", "entry-1"), {reactionMs: 120}));
  await assertSucceeds(updateDoc(doc(firestore("guest"), "rooms", "room-1"), {owner: "guest"}));
});
