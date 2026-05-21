import React from "react";

import {Button} from "components-new/Button";

import "components-new/OpponentSection/styles.scss";

type LeaderboardRow = {
  key: string;
  primary: string;
  secondary?: string;
  value: string;
  highlighted?: boolean;
  muted?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type RoomLeaderboardProps = {
  title: string;
  leftLabel: string;
  rightLabel: string;
  rows: LeaderboardRow[];
};

export const RoomLeaderboard = ({
  title,
  leftLabel,
  rightLabel,
  rows
}: RoomLeaderboardProps) => {
  return (
    <div className="w-full flex flex-col min-h-0 gap-4">
      <div>
        <h3 className="text-2xl md:text-4xl font-bold text-primary-500 dark:text-primary-100">
          {title}
        </h3>
        <div className="mt-4 flex flex-row text-sm md:text-lg text-primary-400 dark:text-primary-200">
          <div className="w-5/6">
            <p>{leftLabel}</p>
          </div>
          <div className="w-1/6 text-center">
            <p>{rightLabel}</p>
          </div>
        </div>
      </div>

      <div className="opponents-container flex min-h-0 flex-row overflow-y-auto pl-1 pr-1 pt-1">
        <div className="w-5/6 pr-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className={`opponent-row flex min-h-[72px] md:min-h-[104px] items-center justify-between gap-3 ${
                row.highlighted ? "local" : ""
              }`}
            >
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-lg md:text-2xl font-bold">
                  {row.primary}
                </p>
                {row.secondary && (
                  <p
                    className={`mt-1 text-xs md:text-sm ${
                      row.highlighted
                        ? "text-primary-100/80"
                        : "text-primary-400 dark:text-primary-200"
                    }`}
                  >
                    {row.secondary}
                  </p>
                )}
              </div>

              {row.action && (
                <Button
                  variant="outlined"
                  className="shrink-0 px-2 text-sm md:text-2xl"
                  onClick={row.action.onClick}
                >
                  <span
                    className={
                      row.highlighted ? "text-primary-100" : "text-primary-500"
                    }
                  >
                    {row.action.label}
                  </span>
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="w-1/6 text-center">
          {rows.map((row) => (
            <div
              key={`${row.key}-value`}
              className={`mb-4 flex min-h-[72px] md:min-h-[104px] items-center justify-center text-lg md:text-2xl font-bold ${
                row.highlighted
                  ? "text-primary-100"
                  : row.muted
                    ? "text-primary-500 dark:text-primary-200"
                    : "text-primary-500 dark:text-primary-100"
              }`}
            >
              {row.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
