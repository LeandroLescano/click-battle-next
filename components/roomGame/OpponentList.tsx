import { getDatabase, ref, update } from "firebase/database";
import { useRouter } from "next/dist/client/router";
import React from "react";
import { Flipped, Flipper } from "react-flip-toolkit";
import Swal from "sweetalert2";
import { User } from "../../pages/game/[roomGame]";

interface Props {
  countPositions: {
    count: number;
    list: User[];
  };
  localUsername: string;
  isLocal: boolean;
}

const OpponentList = ({ countPositions, localUsername, isLocal }: Props) => {
  const router = useRouter();
  const pathIdGame = router.query.roomGame;
  const db = getDatabase();

  const kickUser = (userKey: string | null) => {
    if (userKey) {
      let userRef = ref(db, `games/${pathIdGame}/listUsers/${userKey}`);
      update(userRef, { kickOut: true }).then(() => {
        Swal.fire({
          title: "The user has been kicked.",
          icon: "success",
          toast: true,
          showConfirmButton: false,
          position: "bottom-end",
          timer: 2500,
        });
      });
    }
  };

  const FlipItem = ({ username, userKey }: any) => {
    return (
      <Flipped key={userKey} flipId={userKey}>
        <div className="visitor-container">
          <div
            className={`row row-user ${
              localUsername === username && "local-row"
            }`}
          >
            <div className="col-10 text-start">{username}</div>
            {isLocal && localUsername !== username && (
              <div
                className="col-2 btn-kick"
                onClick={() => {
                  kickUser(userKey || null);
                }}
              >
                kick
              </div>
            )}
          </div>
        </div>
      </Flipped>
    );
  };

  return (
    <Flipper flipKey={countPositions.count}>
      {countPositions.list.map((user, i) => {
        return <FlipItem username={user.username} key={i} userKey={user.key} />;
      })}
    </Flipper>
  );
};

export default React.memo(OpponentList);
