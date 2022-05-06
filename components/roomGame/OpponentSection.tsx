import React, { forwardRef } from "react";

import FlipMove from "react-flip-move";
import { User } from "../../pages/game/[roomGame]";

interface OpponentSectionProps {
  opponents: User[];
  isLocal: boolean;
  localUser: User;
  kickOpponent: Function;
  maxUsers: number;
}

function OpponentSection({
  opponents,
  isLocal,
  localUser,
  kickOpponent,
  maxUsers,
}: OpponentSectionProps) {
  const FlipItem = forwardRef(
    ({ username, clicks, userKey }: any, ref: any) => {
      return (
        <div className="visitor-container" ref={ref} key={userKey}>
          <div
            className={`row row-user ${
              localUser.username === username && "local-row"
            }`}
          >
            <div className="col-8 text-start">{username}</div>
            <div className={isLocal ? "col-2" : "col-4"}>{clicks}</div>
            {isLocal && localUser.username !== username && (
              <div
                className="col-2"
                onClick={() => {
                  kickOpponent(userKey || null);
                }}
              >
                X
              </div>
            )}
          </div>
        </div>
      );
    }
  );

  return (
    <>
      {opponents.length > 1 ? (
        <div className="row row-users-title">
          <div className="col-8 text-start">
            <p className="mb-2">
              Opponents ({opponents.length - 1}/{maxUsers - 1})
            </p>
          </div>
          <div className={`${isLocal ? "col-2" : "col-4"} pe-4`}>Clicks</div>
        </div>
      ) : (
        isLocal && <h4>Waiting for opponents...</h4>
      )}
      <FlipMove
        duration={500}
        delay={0}
        easing="ease"
        staggerDurationBy={15}
        staggerDelayBy={20}
      >
        {opponents
          .sort((a, b) => b.clicks - a.clicks)
          .map((user, i) => {
            return (
              <FlipItem
                clicks={user.clicks}
                username={user.username}
                key={user.key}
                userKey={user.key}
              />
            );
          })}
      </FlipMove>
    </>
  );
}

export default OpponentSection;
