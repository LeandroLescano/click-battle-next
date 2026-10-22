import {calculateRanking, GameUser} from "@leandrolescano/click-battle-core";
import {getFirestore} from "firebase-admin/firestore";
import type {Metadata} from "next";
import {unstable_cache} from "next/cache";
import React from "react";

import {Ranking} from "components-new/Ranking";
import {customInitApp} from "lib/firebase-admin-config";
import {
  buildPublicReactionRanking,
  toPublicClassicRankingEntry,
  type ReactionRankingRoom
} from "lib/ranking/publicRanking";
import {createRouteMetadata} from "lib/seo/metadata";

customInitApp();

export async function generateMetadata(): Promise<Metadata> {
  return createRouteMetadata("ranking");
}

const getRanking = unstable_cache(
  async () => {
    const db = getFirestore();
    const [usersSnapshot, roomsSnapshot] = await Promise.all([
      db.collection("users").select("username", "maxScores").get(),
      db.collection("rooms").get()
    ]);

    const users: GameUser[] = [];

    usersSnapshot.docs.forEach((doc) => {
      const user = doc.data() as Pick<GameUser, "username" | "maxScores">;
      users.push({
        key: doc.id,
        username: user.username,
        maxScores: user.maxScores
      });
    });

    const classicRanking = calculateRanking(users).flatMap((entry) => {
      if (typeof entry.key !== "string") {
        return [];
      }

      return [
        toPublicClassicRankingEntry({
          key: entry.key,
          username: entry.username,
          cps: entry.cps,
          time: entry.time
        })
      ];
    });
    const reactionRanking = buildPublicReactionRanking(
      roomsSnapshot.docs.map((doc) => doc.data() as ReactionRankingRoom)
    );

    return {
      lastUpdate: new Date(),
      rankings: {
        "classic-speed": classicRanking,
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

  return (
    <Ranking
      rankings={JSON.parse(JSON.stringify(rankings))}
      lastUpdate={lastUpdate}
    />
  );
};

export default RankingWrapper;
