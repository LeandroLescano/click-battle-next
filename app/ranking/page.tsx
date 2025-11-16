import {getFirestore} from "firebase-admin/firestore";
import {unstable_cache} from "next/cache";
import React from "react";

import {Ranking} from "components-new/Ranking";
import {UserWithScore} from "components-new/Ranking/types";
import {GameUser} from "interfaces";
import {customInitApp} from "lib/firebase-admin-config";

customInitApp();

const getRanking = unstable_cache(
  async () => {
    const db = getFirestore();
    const ref = db.collection("users");
    const usersWithScore: UserWithScore[] = [];

    await ref.get().then((data) => {
      data.docs.forEach((doc) => {
        const user = doc.data() as GameUser;

        if (user.maxScores && user.maxScores.length > 0) {
          const cps = Math.max(
            ...user.maxScores.map((score) => score.clicks / score.time)
          );
          const time =
            user.maxScores.find((ms) => ms.clicks / ms.time === cps)?.time ||
            10;
          usersWithScore.push({
            username: user.username,
            key: doc.id,
            maxScores: user.maxScores,
            cps: Math.round(cps * 100) / 100, // This rounds to max 2 decimal places
            time
          });
        }
      });
    });

    const lastUpdate = new Date();

    return {users: JSON.stringify(usersWithScore), lastUpdate};
  },
  undefined,
  {
    revalidate: 3600
  }
);

const RankingWrapper = async () => {
  const {users, lastUpdate} = await getRanking();

  return <Ranking usersWithScore={JSON.parse(users)} lastUpdate={lastUpdate} />;
};

export default RankingWrapper;
