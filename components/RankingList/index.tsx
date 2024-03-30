"use client";

import React from "react";
import {RankingListProps} from "./types";
import {useAuth} from "contexts/AuthContext";

const RankComponent: Record<string, keyof JSX.IntrinsicElements> = {
  1: "h2",
  2: "h3",
  3: "h4",
  default: "span"
};

export const RankingList = ({users}: RankingListProps) => {
  const {gameUser} = useAuth();

  return (
    <>
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
                {i + 1}. {user.username || "???????"}{" "}
                {gameUser?.username === user.username && "(You)"}
              </span>
              <span className="text-lowercase">
                {user.cps} cps ({user.time}s)
              </span>
            </Component>
          );
        })}
    </>
  );
};
