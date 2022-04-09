import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { User } from "../../pages/game/[roomGame]";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";

interface ResultSectionProps {
  localPosition: String | undefined;
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
  isLocal,
}: ResultSectionProps) {
  return (
    <div id="result-container" className="result-container text-center mb-2">
      <h1 id="result" className="no-select">
        Result - {localPosition} place
      </h1>
      {listUsers
        .sort((a, b) => (a.clicks < b.clicks ? 1 : -1))
        .map((user, i) => {
          return (
            <p
              key={i}
              className={`row-user ${
                user.username === localUser.username ? "local-row" : ""
              }`}
            >
              {i === 0 && <FontAwesomeIcon icon={faTrophy} className="mx-1" />}
              <b>{user.username}</b> with {user.clicks} clicks!
              {i === 0 && <FontAwesomeIcon icon={faTrophy} className="mx-1" />}
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
