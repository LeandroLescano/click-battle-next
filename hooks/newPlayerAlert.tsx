import {GameUser} from "@leandrolescano/click-battle-core";
import {useEffect, useRef, useState} from "react";

import {useTabFocus} from "./tabFocus";

const TITLE_NEW_USER = "New opponent!";
const TITLE_DEFAULT = "Click Battle";

export const useNewPlayerAlert = (
  listUsers: GameUser[],
  localUser: GameUser
) => {
  const [newUser, setNewUser] = useState(false);

  const audioPlayer = useRef<HTMLAudioElement>();
  const isFocused = useTabFocus();

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

  return {setNewUser};
};
