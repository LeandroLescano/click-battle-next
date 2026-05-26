import {calculateRanking, GameUser} from "@leandrolescano/click-battle-core";
import {getFirestore} from "firebase-admin/firestore";
import {unstable_cache} from "next/cache";
import React from "react";

import {Ranking} from "components-new/Ranking";
import {customInitApp} from "lib/firebase-admin-config";

customInitApp();

const getRanking = unstable_cache(
  async () => {
    const db = getFirestore();
    const ref = db.collection("users");
    const users: GameUser[] = [];

    await ref.get().then((data) => {
      data.docs.forEach((doc) => {
        const user = doc.data() as GameUser;
        users.push({...user, key: doc.id});
      });
    });

    const usersWithScore = calculateRanking(users);

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
