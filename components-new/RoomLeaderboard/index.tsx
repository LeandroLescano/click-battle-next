import {cloneElement} from "react";
import {Flipped, Flipper} from "react-flip-toolkit";

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
  flipKey?: number | string;
};

export const RoomLeaderboard = ({
  title,
  leftLabel,
  rightLabel,
  rows,
  flipKey
}: RoomLeaderboardProps) => {
  const renderPrimaryRow = (row: LeaderboardRow) => {
    const rowContent = (
      <div
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
                row.highlighted ? "text-primary-100/80" : "text-primary-400"
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
    );

    if (flipKey === undefined) {
      return cloneElement(rowContent, {key: row.key});
    }

    return (
      <Flipped key={row.key} flipId={`leaderboard-row-${row.key}`}>
        {rowContent}
      </Flipped>
    );
  };

  const renderValueRow = (row: LeaderboardRow) => {
    const valueContent = (
      <div
        className={`mb-4 flex min-h-[72px] md:min-h-[104px] items-center justify-center text-lg md:text-2xl font-bold ${
          row.highlighted
            ? "text-primary-300"
            : row.muted
            ? "text-primary-500 dark:text-primary-200"
            : "text-primary-500 dark:text-primary-100"
        }`}
      >
        {row.value}
      </div>
    );

    if (flipKey === undefined) {
      return cloneElement(valueContent, {key: `${row.key}-value`});
    }

    return (
      <Flipped key={`${row.key}-value`} flipId={`leaderboard-value-${row.key}`}>
        {valueContent}
      </Flipped>
    );
  };

  const rowsContent = (
    <div className="opponents-container flex min-h-0 flex-row overflow-y-auto pl-1 pr-1 pt-1">
      <div className="w-5/6 pr-3">{rows.map(renderPrimaryRow)}</div>

      <div className="w-1/6 text-center">{rows.map(renderValueRow)}</div>
    </div>
  );

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

      {flipKey === undefined ? (
        rowsContent
      ) : (
        <Flipper flipKey={flipKey}>{rowsContent}</Flipper>
      )}
    </div>
  );
};
