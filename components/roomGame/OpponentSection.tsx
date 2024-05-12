import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {GameUser} from "interfaces";

import OpponentList from "./OpponentList";
interface OpponentSectionProps {
  opponents: GameUser[];
  isLocal: boolean;
  localUsername: string;
  maxUsers: number;
}

function OpponentSection({
  opponents,
  isLocal,
  localUsername,
  maxUsers
}: OpponentSectionProps) {
  const [countPositions, setCountPositions] = useState({
    list: opponents,
    count: 0
  });
  const {t} = useTranslation();

  useEffect(() => {
    if (
      !checkOrderArray(
        countPositions.list,
        opponents.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      )
    ) {
      setCountPositions((prev) => ({
        list: opponents.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)),
        count: prev.count + 1
      }));
    }
  }, [opponents]);

  const checkOrderArray = (arr1: GameUser[], arr2: GameUser[]) => {
    if (arr1.length !== arr2.length) return false;
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
        <div className="row">
          <div className="col-10">
            <p className="mb-2">
              {t("Opponents")} ({opponents.length - 1}/{maxUsers - 1})
            </p>
          </div>
          <div className="col-2 text-center">Clicks</div>
        </div>
      ) : (
        isLocal && <h4>{t("Waiting for opponents...")}</h4>
      )}
      <div className="row">
        <div className="col-10">
          <OpponentList
            isLocal={isLocal}
            countPositions={countPositions}
            localUsername={localUsername}
          />
        </div>
        <div className="col-2">
          {opponents
            .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
            .map((user, i) => {
              return (
                <div key={i} className={`row row-click`}>
                  {user.clicks}
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default OpponentSection;
