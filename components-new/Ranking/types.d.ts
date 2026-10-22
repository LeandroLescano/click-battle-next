import type {GameMode} from "@leandrolescano/click-battle-core";

import type {PublicRankingEntry} from "lib/ranking/publicRanking";

export type RankingMode = Extract<GameMode, "classic-speed" | "reaction">;

export interface RankingProps {
  lastUpdate: Date;
  rankings: Record<RankingMode, PublicRankingEntry[]>;
}
