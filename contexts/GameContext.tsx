"use client";

import {GameUser} from "@leandrolescano/click-battle-core";
import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  useCallback,
  useMemo
} from "react";
import {useTranslation} from "react-i18next";

import {FinalResults, Game} from "interfaces";
import {getSuffixPosition} from "utils/string";

interface GameContextState {
  game: Game;
  setGame: (game: Partial<Game>) => void;
  resetGame: VoidFunction;
  localUser: GameUser;
  setLocalUser: (user: GameUser) => void;
  isHost: boolean;
  hasEnteredPassword?: boolean;
  finalResults?: FinalResults;
  setIsHost: (isHost: boolean) => void;
  calculatePosition: VoidFunction;
  resetContext: VoidFunction;
  setHasEnteredPassword: (hasEnteredPassword: boolean) => void;
}

const initialGame: Game = {
  status: "lobby",
  listUsers: [],
  ownerUser: {
    username: ""
  },
  roomName: "",
  gameMode: "classic-speed",
  modeSettings: {
    gameMode: "classic-speed",
    config: {}
  },
  settings: {
    maxUsers: 2,
    password: "",
    timer: 10
  },
  key: ""
};

const GameContext = createContext<GameContextState>({
  game: initialGame,
  isHost: false,
  localUser: {
    username: "",
    clicks: 0
  },
  finalResults: undefined,
  setGame: () => {},
  resetGame: () => {},
  setLocalUser: () => {},
  setIsHost: () => {},
  calculatePosition: () => {},
  resetContext: () => {},
  setHasEnteredPassword: () => {}
});

interface Props {
  children: JSX.Element;
}

export function GameProvider({children}: Props) {
  const game = useGameProvider();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  return useContext(GameContext);
};

function useGameProvider(): GameContextState {
  const [game, setGame] = useState<Game>(initialGame);
  const [finalResults, setFinalResults] = useState<FinalResults>();
  const [localUser, setLocalUser] = useState<GameUser>({
    username: "",
    clicks: 0
  });
  const [isHost, setIsHost] = useState(false);
  const [hasEnteredPassword, setHasEnteredPassword] = useState(false);

  const {t} = useTranslation();

  useEffect(() => {
    const storedGame = sessionStorage.getItem("game");
    if (storedGame) {
      setGame(JSON.parse(storedGame));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("game", JSON.stringify(game));
  }, [game]);

  const calculatePosition = useCallback(() => {
    const position =
      [...game.listUsers]
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .findIndex((user) => user.key === localUser.key) + 1;

    setFinalResults({
      localPosition: position,
      localPositionSuffix: getSuffixPosition(position, t),
      results: game.listUsers
    });
  }, [game.listUsers, localUser.key, t]);

  const setPartialGame = useCallback((partialGame: Partial<Game>) => {
    setGame((prev) => ({...prev, ...partialGame}));
  }, []);

  const resetGame = useCallback(() => {
    setGame(initialGame);
  }, []);

  const resetContext = useCallback(() => {
    setGame(initialGame);
    setFinalResults(undefined);
    setLocalUser({username: "", clicks: 0});
    setIsHost(false);
  }, []);

  return useMemo(
    () => ({
      game,
      localUser,
      isHost,
      hasEnteredPassword,
      finalResults,
      setHasEnteredPassword,
      setGame: setPartialGame,
      setLocalUser,
      resetGame,
      setIsHost,
      calculatePosition,
      resetContext
    }),
    [
      game,
      localUser,
      isHost,
      hasEnteredPassword,
      finalResults,
      setPartialGame,
      resetGame,
      calculatePosition,
      resetContext
    ]
  );
}
