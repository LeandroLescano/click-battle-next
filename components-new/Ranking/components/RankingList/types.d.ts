import {RankingEntry, RankingMode} from "components-new/Ranking/types";

export interface RankingListProps {
  mode: RankingMode;
  users: RankingEntry[];
}
