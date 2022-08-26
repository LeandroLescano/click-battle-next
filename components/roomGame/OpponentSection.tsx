import React, { useEffect, useState } from "react";

import { User } from "../../pages/game/[roomGame]";
import OpponentList from "./OpponentList";

interface OpponentSectionProps {
  opponents: User[];
  isLocal: boolean;
  localUsername: string;
  maxUsers: number;
}

function OpponentSection({
  opponents,
  isLocal,
  localUsername,
  maxUsers,
}: OpponentSectionProps) {
  const [countPositions, setCountPositions] = useState({
    list: opponents,
    count: 0,
  });

  useEffect(() => {
    if (
      !checkOrderArray(
        countPositions.list,
        opponents.sort((a, b) => b.clicks - a.clicks)
      )
    ) {
      setCountPositions((prev) => ({
        list: opponents.sort((a, b) => b.clicks - a.clicks),
        count: prev.count + 1,
      }));
    }
  }, [opponents]);

  useEffect(() => {
    console.log("countPositions change");
  }, [countPositions.list]);

  const checkOrderArray = (arr1: User[], arr2: User[]) => {
    for (let x = 0; x < arr1.length; x++) {
      if (arr1[x].key !== arr2[x].key) {
        return false;
      }
    }
    return true;
  };

  return (
    <>
      {opponents.length > 1 ? (
        <div className="row row-users-title">
          <div className="col-8 text-start">
            <p className="mb-2">
              Opponents ({opponents.length - 1}/{maxUsers - 1})
            </p>
          </div>
          {/* <div className={`${isLocal ? "col-2" : "col-4"} pe-4`}>Clicks</div> */}
        </div>
      ) : (
        isLocal && <h4>Waiting for opponents...</h4>
      )}
      <div className="d-flex">
        <div
          style={{ minWidth: 100, display: "flex", flexDirection: "column" }}
        >
          {opponents
            .sort((a, b) => b.clicks - a.clicks)
            .map((user, i) => {
              return (
                <span
                  key={i}
                  style={{
                    height: 36,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {user.clicks}
                </span>
              );
            })}
        </div>
        <div style={{ flex: 1 }}>
          <OpponentList
            isLocal={isLocal}
            countPositions={countPositions}
            localUsername={localUsername}
          />
        </div>
      </div>
    </>
  );
}

export default React.memo(OpponentSection);
