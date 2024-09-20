import React from "react";
import {customInitApp} from "lib/firebase-admin-config";
import {getFirestore} from "firebase-admin/firestore";
import {Card, CardBody, CardHeader, Container} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import dynamic from "next/dynamic";
import {unstable_cache} from "next/cache";

import {GameUser} from "interfaces";
import {RankingList} from "components/RankingList";
import {getServerTranslations} from "i18n/server";

const UpdatedTime = dynamic(() => import("components/UpdatedTime"), {
  ssr: false
});

customInitApp();

type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]};

const getRanking = unstable_cache(
  async () => {
    const db = getFirestore();
    const ref = db.collection("users");
    const usersWithScore: (WithRequired<GameUser, "maxScores"> & {
      cps: number;
      time: number;
    })[] = [];

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

    return {users: usersWithScore, lastUpdate};
  },
  undefined,
  {
    revalidate: 3600
  }
);

const Ranking = async () => {
  const {t} = await getServerTranslations("translation");
  const {users, lastUpdate} = await getRanking();

  return (
    <Container fluid="md" className="p-2 h-100">
      <Card className="h-100">
        <CardHeader>
          <section className="d-flex flex-lg-row align-items-lg-end justify-content-between mb-0 gap-lg-0 gap-2">
            <span className="flex-fill d-flex gap-4 align-items-lg-end align-items-center">
              <Link href="/" passHref>
                <button className="btn-click small p-2 btn-back mb-2 float-lg-start">
                  <FontAwesomeIcon
                    icon={faArrowLeft as IconProp}
                    size="xs"
                    className="mx-2"
                  />
                </button>
              </Link>
              <h1 className="mb-0">Click masters</h1>
            </span>
            <UpdatedTime text={t("Last update") + ":"} date={lastUpdate} />
          </section>
        </CardHeader>
        <CardBody className="d-flex flex-column h-100 overflow-y-auto p-1">
          <RankingList users={users} />
        </CardBody>
      </Card>
    </Container>
  );
};

export default Ranking;
