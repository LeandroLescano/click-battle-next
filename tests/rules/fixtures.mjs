import {readFile} from "node:fs/promises";

import {initializeTestEnvironment} from "@firebase/rules-unit-testing";
import {ref, set, update, remove} from "firebase/database";
import {doc, setDoc, updateDoc} from "firebase/firestore";

const projectId = "demo-click-battle-rules";
let env;

export const createRulesEnvironment = async () => {
  if (!env) {
    env = await initializeTestEnvironment({
      projectId,
      database: {rules: await readFile("database.rules.json", "utf8")},
      firestore: {rules: await readFile("firestore.rules", "utf8")}
    });
  }
  return env;
};

export const cleanupRulesEnvironment = async () => env?.cleanup();
export const rtdb = (uid) => env.authenticatedContext(uid).database();
export const firestore = (uid, token = {}) =>
  env.authenticatedContext(uid, token).firestore();
export {doc, ref, remove, set, setDoc, update, updateDoc};

export const room = ({mode = "reaction", roundStatus = "signal"} = {}) => ({
  ownerUser: {key: "host", username: "Host"},
  hostLease: {ownerId: "host", sessionId: "session-1", claimedAt: 1, lastRenewedAt: 1},
  gameMode: mode,
  status: "lobby",
  settings: {maxUsers: 4, timer: 30},
  listUsers: {
    host: {username: "Host", rol: "owner", clicks: 0},
    guest: {username: "Guest", rol: "visitor", clicks: 0}
  },
  reactionCurrentRoundId: "round-1",
  reactionRounds: {
    "round-1": {roundId: "round-1", status: roundStatus, windowMs: 5000}
  }
});

export const seedRoom = async (value = room()) => {
  await env.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "games/room-1"), value);
  });
};

export const validResult = (uid = "guest", username = "Guest") => ({
  playerKey: uid,
  username,
  status: "valid",
  clickedAt: 1200,
  signalShownAt: 1000,
  reactionMs: 200,
  inputType: "click"
});

export const falseStartResult = (uid = "guest", username = "Guest") => ({
  playerKey: uid,
  username,
  status: "false-start",
  clickedAt: 1200,
  inputType: "click"
});
