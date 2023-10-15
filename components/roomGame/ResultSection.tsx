import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React from "react";
import {User} from "interfaces";
import {faTrophy} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

interface ResultSectionProps {
  localPosition: string | undefined;
  listUsers: Array<User>;
  localUser: User;
  handleReset: () => void;
  isLocal: boolean;
}

function ResultSection({
  listUsers,
  localPosition,
  localUser,
  handleReset,
  isLocal
}: ResultSectionProps) {
  return (
    <div id="result-container" className="result-container text-center mb-2">
      <h1 id="result" className="no-select">
        Result - {localPosition} place
      </h1>
      {listUsers
        .sort((a, b) => ((a.clicks || 0) < (b.clicks || 0) ? 1 : -1))
        .map((user, i) => {
          return (
            <p
              key={i}
              className={`row-user ${
                user.username === localUser.username ? "local-row" : ""
              }`}
            >
              {i === 0 && (
                <FontAwesomeIcon icon={faTrophy as IconProp} className="mx-1" />
              )}
              <b>{user.username}</b> with {user.clicks} clicks!
              {i === 0 && (
                <FontAwesomeIcon icon={faTrophy as IconProp} className="mx-1" />
              )}
            </p>
          );
        })}
      {isLocal && (
        <button className="btn-click mt-5" onClick={handleReset}>
          Reset
        </button>
      )}
    </div>
  );
}

export default ResultSection;
