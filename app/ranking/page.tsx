export const revalidate = 3600; // revalidate at most every hour

import React from "react";
import {customInitApp} from "lib/firebase-admin-config";
import {getDatabase} from "firebase-admin/database";
import {Card, CardBody, CardHeader, Container} from "react-bootstrap";
import dynamic from "next/dynamic";

// Interfaces
import {GameUser} from "interfaces";

const UpdatedTime = dynamic(() => import("components/UpdatedTime"), {
  ssr: false
});

customInitApp();

type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]};

const getRanking = async () => {
  const db = getDatabase();
  const ref = db.ref("users");
  const usersWithScore: WithRequired<GameUser, "maxScore">[] = [];
  await ref.once("value", (data) => {
    const users = data.val() as {[key: string]: GameUser};

    Object.entries(users).forEach(([key, user]) => {
      if (user.maxScore) {
        usersWithScore.push({
          ...user,
          key,
          maxScore: user.maxScore
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
    <Container fluid="md" className="p-4 h-100">
      <Card className="h-100">
        <CardHeader>
          <section className="d-flex flex-row align-items-end justify-content-between mb-0">
            <h1 className="mb-0">Click masters</h1>
            <UpdatedTime text="last update:" date={lastUpdate} />
          </section>
        </CardHeader>
        <CardBody className="d-flex flex-column h-100 overflow-y-auto">
          {users
            .sort((a, b) => b.maxScore - a.maxScore)
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
                  {user.maxScore}
                </Component>
              );
            })}
        </CardBody>
      </Card>
    </Container>
  );
};

export default Ranking;
