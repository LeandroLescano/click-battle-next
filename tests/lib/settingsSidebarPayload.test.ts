import assert from "node:assert/strict";
import test from "node:test";

import {buildSettingsUpdatePayload} from "../../components-new/SettingsSidebar/settingsPayload.ts";

const classicSettings = {
  gameMode: "classic-speed",
  maxUsers: 8,
  roomName: "Friday lobby",
  password: "hashed-password",
  timer: 5
} as const;

test("omits game mode fields when saving Classic settings without changing mode", () => {
  let modeSettingsCalls = 0;
  const payload = buildSettingsUpdatePayload({
    settings: classicSettings,
    currentGameMode: "classic-speed",
    canChangeGameMode: true,
    getModeSettings: () => {
      modeSettingsCalls += 1;
      return {gameMode: "classic-speed", config: {} as Record<string, never>};
    }
  });

  assert.deepEqual(payload, {
    roomName: "Friday lobby",
    "settings/maxUsers": 8,
    "settings/password": "hashed-password",
    "settings/timer": 5
  });
  assert.equal(modeSettingsCalls, 0);
});

test("includes mode fields when the selected game mode changes", () => {
  assert.deepEqual(
    buildSettingsUpdatePayload({
      settings: {...classicSettings, gameMode: "reaction"},
      currentGameMode: "classic-speed",
      canChangeGameMode: true,
      getModeSettings: () => ({
        gameMode: "reaction",
        config: {windowMs: 1500}
      })
    }),
    {
      roomName: "Friday lobby",
      "settings/maxUsers": 8,
      "settings/password": "hashed-password",
      "settings/timer": 5,
      gameMode: "reaction",
      modeSettings: {gameMode: "reaction", config: {windowMs: 1500}}
    }
  );
});
