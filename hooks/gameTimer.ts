import {getAnalytics, logEvent} from "firebase/analytics";
import {getDatabase, ref, update} from "firebase/database";
import {Timestamp} from "firebase/firestore";
import moment from "moment";
import {useEffect, useState} from "react";

import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Game, MaxScore, RoomStats} from "interfaces";
import {updateUser} from "services/user";

const COUNTDOWN = 3;

const useGameTimer = ({
  roomStats,
  onFinish
}: {
  roomStats?: {current: RoomStats};
  onFinish?: VoidFunction;
}) => {
  const {user: gUser, gameUser, updateGameUser} = useAuth();
  const {game, calculatePosition, localUser} = useGame();
  const [remainingTime, setRemainingTime] = useState(game.settings.timer);
  const [countdown, setCountdown] = useState(COUNTDOWN);
  const db = getDatabase();

  useEffect(() => {
    if (!game?.startTime) return;

    if (game.status === "countdown" && countdown > 0) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => --prev);
      }, 1000);

      return () => clearInterval(countdownInterval);
    } else if (game.status !== "ended") {
      if (localUser.rol === "owner") {
        const refGame = ref(db, `games/${game.key}`);
        const updatedGame: Partial<Game> = {
          status: "playing"
        };
        update(refGame, updatedGame);
      }
      setCountdown(COUNTDOWN);
    }
  }, [game?.startTime, countdown, localUser.rol, game.status]);

  useEffect(() => {
    if (game.status !== "playing") return;

    const endTime = moment(game.startTime).add(
      game.settings.timer + COUNTDOWN,
      "seconds"
    );

    const timerInterval = setInterval(() => {
      const remaining = Math.ceil(
        endTime.diff(moment(), "milliseconds") / 1000
      );

      if (remaining >= 0) {
        setRemainingTime(remaining);
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [game?.status]);

  // useEffect for update timer in state and show result
  useEffect(() => {
    if (game) {
      if (!game.startTime) {
        setRemainingTime(game.settings.timer);
      }

      const userKey = sessionStorage.getItem("userKey");

      if (localUser.rol === "owner") {
        // localUser is owner
        if (remainingTime === 0 && game.status === "playing") {
          logEvent(getAnalytics(), "game_finish", {
            date: new Date(),
            users: game.listUsers,
            maxClicks: Math.max(
              ...game.listUsers.map((users) => users.clicks || 0)
            )
          });

          roomStats?.current.gamesPlayed.push({
            maxClicks: Math.max(...game.listUsers.map((lu) => lu.clicks || 0)),
            numberOfUsers: game.listUsers.length,
            timer: game.settings.timer
          });

          const refGame = ref(db, `games/${game.key}`);
          const endedGame: Partial<Game> = {status: "ended"};

          update(refGame, endedGame);
          onFinish?.();
          calculatePosition();
          updateLocalMaxScore(userKey);
        }

        return;
      } else if (game.status === "ended" || remainingTime === 0) {
        // localUser is visitor
        onFinish?.();
        calculatePosition();
        updateLocalMaxScore(userKey);
      }
    }
  }, [game, remainingTime]);

  const updateLocalMaxScore = (userKey?: string | null) => {
    if (localUser.clicks && gameUser && game) {
      const currentMaxScore = gameUser.maxScores?.find(
        (score) => score.time === game.settings.timer
      );

      let updatedScores: MaxScore[] | undefined = gameUser.maxScores;
      if (!currentMaxScore || localUser.clicks > currentMaxScore.clicks) {
        if (!gameUser.maxScores) {
          updatedScores = [
            {
              clicks: localUser.clicks,
              time: game.settings.timer,
              date: Timestamp.now()
            }
          ];
        } else {
          if (currentMaxScore) {
            updatedScores = gameUser.maxScores.map((score) =>
              score.time === game.settings.timer
                ? {...score, clicks: localUser.clicks!, date: Timestamp.now()}
                : score
            );
          } else {
            updatedScores = [
              ...gameUser.maxScores,
              {
                time: game.settings.timer,
                clicks: localUser.clicks,
                date: Timestamp.now()
              }
            ];
          }
        }
      }

      const position =
        game.listUsers.findIndex(
          (user) => user.username === localUser.username
        ) + 1;
      const pointsEarned = game.listUsers.length - position;

      if (updatedScores || pointsEarned > 0) {
        if (userKey && gUser && !gUser.isAnonymous) {
          updateUser(userKey, {
            maxScores: updatedScores,
            points: (gameUser.points ?? 0) + pointsEarned
          });
        }
        updateGameUser({
          maxScores: updatedScores,
          points: (gameUser.points ?? 0) + pointsEarned
        });
      }
    }
  };

  return {remainingTime, countdown};
};

export default useGameTimer;
