"use client";

import React, {useState, useContext, createContext, useEffect} from "react";

import {Game} from "interfaces";

interface GameContextState {
  game: Game;
  setGame: (game: Partial<Game>) => void;
  localPosition?: string;
  setLocalPosition: (position: string) => void;
  resetGame: VoidFunction;
}

const initialGame = {
  currentGame: false,
  gameStart: false,
  listUsers: [],
  ownerUser: {
    username: ""
  },
  roomName: "",
  settings: {
    maxUsers: 2,
    password: "",
    timer: 10
  },
  timer: 10,
  timeStart: 3,
  key: ""
};

const GameContext = createContext<GameContextState>({
  game: initialGame,
  setGame: () => {},
  localPosition: undefined,
  setLocalPosition: () => {},
  resetGame: () => {}
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
  const [localPosition, setLocalPosition] = useState<string>();

  useEffect(() => {
    const storedGame = sessionStorage.getItem("game");
    if (storedGame) {
      setGame(JSON.parse(storedGame));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("game", JSON.stringify(game));
  }, [game]);

  const setPartialGame = (partialGame: Partial<Game>) => {
    setGame((prev) => ({...prev, ...partialGame}));
  };

  const resetGame = () => {
    setGame(initialGame);
  };

  return {
    game,
    setGame: setPartialGame,
    localPosition,
    setLocalPosition,
    resetGame
  };
}
