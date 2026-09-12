import test from "node:test";
import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import {cleanupRulesEnvironment, createRulesEnvironment, doc, firestore, setDoc, updateDoc} from "./fixtures.mjs";

test.before(async () => createRulesEnvironment());
test.after(async () => cleanupRulesEnvironment());

test("authenticated clients retain the existing statistics persistence flow", async () => {
  await assertSucceeds(setDoc(doc(firestore("guest"), "rooms", "room-1"), {gamesPlayed: []}));
  await assertSucceeds(setDoc(doc(firestore("guest"), "reactionRankings", "entry-1"), {reactionMs: 120}));
  await assertSucceeds(updateDoc(doc(firestore("guest"), "rooms", "room-1"), {owner: "guest"}));
});

test("a profile can only be created and updated by its email owner", async () => {
  const guest = firestore("guest", {email: "guest@example.com"});
  const host = firestore("host", {email: "host@example.com"});
  const guestProfile = doc(guest, "users", "guest-profile");

  await assertSucceeds(
    setDoc(guestProfile, {email: "guest@example.com", username: "Guest"})
  );
  await assertSucceeds(updateDoc(guestProfile, {username: "Guest 2"}));
  await assertFails(updateDoc(doc(host, "users", "guest-profile"), {username: "Hacked"}));
  await assertFails(
    setDoc(doc(host, "users", "host-profile"), {
      email: "guest@example.com",
      username: "Hacked"
    })
  );
});
