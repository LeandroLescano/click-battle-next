export const revalidate = 3600; // revalidate at most every hour

import React from "react";
import {customInitApp} from "lib/firebase-admin-config";
import {getFirestore} from "firebase-admin/firestore";
import {Card, CardBody, CardHeader, Container} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import dynamic from "next/dynamic";

// Interfaces
import {GameUser} from "interfaces";

const UpdatedTime = dynamic(() => import("components/UpdatedTime"), {
  ssr: false
});

customInitApp();

type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]};

const getRanking = async () => {
  const db = getFirestore();
  const ref = db.collection("users");
  const usersWithScore: (WithRequired<GameUser, "maxScores"> & {
    cps: number;
  })[] = [];

  await ref.get().then((data) => {
    data.docs.forEach((doc) => {
      const user = doc.data() as GameUser;

      if (user.maxScores) {
        usersWithScore.push({
          ...user,
          key: doc.id,
          maxScores: user.maxScores,
          cps: Math.max(
            ...user.maxScores.map((score) => score.clicks / score.time)
          )
        });
      }
    });
  });

  const lastUpdate = new Date();

  return {users: usersWithScore, lastUpdate};
};

const RankComponent: Record<string, keyof JSX.IntrinsicElements> = {
  1: "h2",
  2: "h3",
  3: "h4",
  default: "span"
};

const Ranking = async () => {
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
            <UpdatedTime text="last update:" date={lastUpdate} />
          </section>
        </CardHeader>
        <CardBody className="d-flex flex-column h-100 overflow-y-auto">
          {users
            .sort((a, b) => b.cps - a.cps)
            .map((user, i) => {
              const Component = RankComponent[i + 1] || RankComponent.default;

              return (
                <Component
                  key={user.key}
                  className="d-flex justify-content-between border-bottom pb-2"
                >
                  <span>
                    {i + 1}. {user.username || "???????"}
                  </span>
                  <span className="text-lowercase">{user.cps} cps</span>
                </Component>
              );
            })}
        </CardBody>
      </Card>
    </Container>
  );
};

export default Ranking;
