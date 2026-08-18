import test from "node:test";
import {assertFails} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, doc, firestore, setDoc, updateDoc} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());

test("clients cannot create or rewrite statistics and ranking inputs", async () => {
  await assertFails(setDoc(doc(firestore("guest"), "rooms", "room-1"), {gamesPlayed: []}));
  await assertFails(setDoc(doc(firestore("guest"), "reactionRankings", "entry-1"), {reactionMs: 120}));
  await assertFails(updateDoc(doc(firestore("guest"), "rooms", "room-1"), {owner: "guest"}));
});
