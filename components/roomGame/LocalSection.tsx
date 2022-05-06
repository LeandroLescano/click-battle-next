import React from "react";
import { User } from "../../pages/game/[roomGame]";

interface LocalSectionProps {
  isLocal: boolean;
  localUser: User;
  start: boolean;
  startCountdown: boolean;
  listUsers: User[];
  handleClick: Function;
  handleStart: Function;
}

function LocalSection({
  isLocal,
  localUser,
  start,
  startCountdown,
  listUsers,
  handleClick,
  handleStart,
}: LocalSectionProps) {
  return (
    <>
      {!start && !startCountdown ? (
        isLocal ? (
          <h4>press start to play</h4>
        ) : (
          <h4>Waiting for host...</h4>
        )
      ) : (
        <h4>You have {localUser.clicks} clicks!</h4>
      )}
      <div className="d-flex justify-content-around">
        <button
          className="btn-click my-2"
          disabled={!start}
          onClick={() => handleClick()}
        >
          Click
        </button>
        {isLocal && !start && !startCountdown && (
          <button
            className="btn-click my-2"
            disabled={!start && listUsers.length < 2}
            onClick={() => handleStart()}
          >
            Start!
          </button>
        )}
      </div>
      <p className="mt-3 mb-0">{localUser.username}</p>
    </>
  );
}

export default LocalSection;
