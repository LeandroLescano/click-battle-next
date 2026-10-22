import type {RankingMode} from "components-new/Ranking/types";
import type {PublicRankingEntry} from "lib/ranking/publicRanking";

export interface RankingListProps {
  mode: RankingMode;
  users: PublicRankingEntry[];
}
