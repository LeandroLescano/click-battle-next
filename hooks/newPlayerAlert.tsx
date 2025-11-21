import {Game, GameUser} from "@leandrolescano/click-battle-core";
import {useEffect, useRef, useState} from "react";

import useGameTimer from "./gameTimer";
import {useTabFocus} from "./tabFocus";

const TITLE_NEW_USER = "👋 New opponent!";
const TITLE_DEFAULT = "Click Battle";

export const useNewPlayerAlert = (
  listUsers: GameUser[],
  localUser: GameUser,
  game?: Game
) => {
  const [newUser, setNewUser] = useState(false);

  const audioPlayer = useRef<HTMLAudioElement>();
  const audioNotif = useRef<HTMLAudioElement>();
  const isFocused = useTabFocus();
  const {countdown, remainingTime} = useGameTimer({});

  // useEffect to alert the owner if a new user enters and tab is not focused
  useEffect(() => {
    let shouldToggleTitle = true;
    if (!audioPlayer.current) {
      audioPlayer.current = new Audio("/sounds/new-player.mp3");
    }
    audioPlayer.current.volume = 0.2;

    if (isFocused) setNewUser(false);

    const showAlert =
      !isFocused &&
      newUser &&
      listUsers.length > 1 &&
      localUser.rol === "owner";

    // Update title immediately on component mount or condition change
    if (showAlert) {
      document.title = shouldToggleTitle ? TITLE_NEW_USER : TITLE_DEFAULT;
      if (shouldToggleTitle) {
        audioPlayer.current.play();
      }
    } else {
      document.title = TITLE_DEFAULT;
    }

    const intervalId = setInterval(() => {
      if (showAlert) {
        shouldToggleTitle = !shouldToggleTitle;

        if (audioPlayer.current && shouldToggleTitle) {
          audioPlayer.current.play();
        }

        document.title = shouldToggleTitle ? TITLE_NEW_USER : TITLE_DEFAULT;
      }
    }, 2500);

    return () => {
      clearInterval(intervalId);
      document.title = TITLE_DEFAULT;
    };
  }, [newUser, isFocused, listUsers.length, localUser.rol]);

  // useEffect to alert player about the game status and tab is not focused
  useEffect(() => {
    if (!audioNotif.current) {
      audioNotif.current = new Audio("/sounds/start-game.mp3");
    }
    audioNotif.current.volume = 0.2;

    if (!isFocused) {
      if (game?.startTime && game.status === "countdown") {
        audioNotif.current.playbackRate = 1;
        document.title = `⚠️ Game is starting in ${countdown}s ⚠️`;
        if (countdown === 0) {
          audioNotif.current.playbackRate = 0.5;
        }
        audioNotif.current.play();
      } else if (game?.startTime && remainingTime) {
        document.title = `Current game❗${remainingTime}s left`;
      } else {
        document.title = TITLE_DEFAULT;
      }
    } else {
      document.title = TITLE_DEFAULT;
    }
  }, [game, isFocused, countdown, remainingTime]);

  return {setNewUser};
};
