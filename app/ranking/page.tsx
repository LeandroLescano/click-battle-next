import {
  calculateRanking,
  GameUser,
  GameMode
} from "@leandrolescano/click-battle-core";
import {getFirestore} from "firebase-admin/firestore";
import {unstable_cache} from "next/cache";
import React from "react";

import {Ranking} from "components-new/Ranking";
import {
  ClassicRankingEntry,
  RankingMode,
  ReactionRankingEntry
} from "components-new/Ranking/types";
import {customInitApp} from "lib/firebase-admin-config";

customInitApp();

const isSupportedRankingMode = (
  value?: GameMode | null
): value is RankingMode => value === "classic-speed" || value === "reaction";

const getRanking = unstable_cache(
  async () => {
    const db = getFirestore();
    const [usersSnapshot, roomsSnapshot] = await Promise.all([
      db.collection("users").get(),
      db.collection("rooms").get()
    ]);

    const users: GameUser[] = [];

    usersSnapshot.docs.forEach((doc) => {
      const user = doc.data() as GameUser;
      users.push({...user, key: doc.id});
    });

    const classicRanking = calculateRanking(users) as ClassicRankingEntry[];
    const reactionMap = new Map<string, ReactionRankingEntry>();

    roomsSnapshot.docs.forEach((doc) => {
      const room = doc.data() as {
        gamesPlayed?: Array<{
          gameMode?: GameMode;
          winnerMetric?: "clicks" | "reactionMs";
          winnerScore?: number | null;
          winnerUsername?: string;
        }>;
      };

      room.gamesPlayed?.forEach((game) => {
        if (
          !isSupportedRankingMode(game.gameMode) ||
          game.gameMode !== "reaction" ||
          game.winnerMetric !== "reactionMs" ||
          typeof game.winnerScore !== "number" ||
          !game.winnerUsername
        ) {
          return;
        }

        const reactionMs = Math.max(0, Math.round(game.winnerScore));
        const entry = reactionMap.get(game.winnerUsername);

        if (!entry) {
          reactionMap.set(game.winnerUsername, {
            key: `${game.winnerUsername}-reaction`,
            mode: "reaction",
            reactionMs,
            roundsWon: 1,
            username: game.winnerUsername
          });
          return;
        }

        entry.roundsWon += 1;
        entry.reactionMs = Math.min(entry.reactionMs, reactionMs);
      });
    });

    const reactionRanking = [...reactionMap.values()].sort((left, right) => {
      if (left.reactionMs !== right.reactionMs) {
        return left.reactionMs - right.reactionMs;
      }

      if (left.roundsWon !== right.roundsWon) {
        return right.roundsWon - left.roundsWon;
      }

      return left.username.localeCompare(right.username);
    });

    return {
      lastUpdate: new Date(),
      rankings: {
        "classic-speed": classicRanking.map((entry) => ({
          ...entry,
          mode: "classic-speed" as const
        })),
        reaction: reactionRanking
      }
    };
  },
  undefined,
  {
    revalidate: 3600
  }
);

const RankingWrapper = async () => {
  const {lastUpdate, rankings} = await getRanking();

  return <Ranking rankings={rankings} lastUpdate={lastUpdate} />;
};

export default RankingWrapper;
