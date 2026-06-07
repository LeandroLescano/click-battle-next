"use client";

import {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import {
  faChartLine,
  faBolt,
  faDoorClosed,
  faDoorOpen,
  faGamepad,
  faLayerGroup,
  faMousePointer,
  faKeyboard
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataset,
  Point,
  Filler,
  ScriptableContext,
  ChartOptions,
  BarElement,
  ArcElement
} from "chart.js";
import {getDatabase, onValue, ref} from "firebase/database";
import moment from "moment";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import React, {useEffect, useMemo, useState} from "react";
import {Bar, Line, Doughnut} from "react-chartjs-2";

import {Loading} from "components-new/Loading";
import {useAuth} from "contexts/AuthContext";
import {DesignPreference} from "interfaces/DesignPreferences";
import {RoomStats} from "interfaces/RoomStats";
import {DEFAULT_GAME_MODE, getGameModeLabelKey} from "lib/game/gameModes";
import {getDesignPreferences} from "services/experience";
import {getRoomStats} from "services/rooms";
import {minutesBetween} from "utils/date";

const ALLOWED_EMAILS = [
  "tatilescano11@gmail.com",
  "leandrolescano11@gmail.com"
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const calculateAverage = (obj1: number[], obj2: number[]): number[] => {
  const averages: number[] = [];

  for (let i = 0; i < obj1.length; i++) {
    const value1 = obj1[i] || 0;
    const value2 = obj2[i] || 0;
    const average = (value1 + value2) / 2.0;
    averages.push(average > 0 ? average : 0.0);
  }

  return averages;
};

const gradientFilter = (
  context: ScriptableContext<"line" | "bar">,
  color: string
) => {
  if (!context.chart.chartArea) return;

  const {
    ctx,
    chartArea: {top, bottom}
  } = context.chart;
  const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
  gradientBg.addColorStop(0, color);
  gradientBg.addColorStop(1, "rgba(0,0,0,0)");
  return gradientBg;
};

const chartTextColor = "rgba(200, 214, 250, 0.9)";
const chartMutedColor = "rgba(200, 214, 250, 0.55)";
const chartGridColor = "rgba(200, 214, 250, 0.14)";

const commonLineOpts = (): ChartOptions<"line"> => ({
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 80,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxHeight: 8,
        boxWidth: 8,
        color: chartTextColor,
        font: {family: "Handjet, system-ui, sans-serif", size: 15}
      }
    },
    tooltip: {
      backgroundColor: "rgba(25, 25, 25, 0.92)",
      borderColor: "rgba(200, 214, 250, 0.35)",
      borderWidth: 1,
      titleColor: chartTextColor,
      bodyColor: chartTextColor
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  },
  scales: {
    x: {
      grid: {color: chartGridColor},
      ticks: {color: chartMutedColor}
    },
    y: {
      beginAtZero: true,
      grid: {color: chartGridColor},
      ticks: {color: chartMutedColor}
    }
  }
});

const commonBarOpts = (stacked = false): ChartOptions<"bar"> => ({
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 80,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxHeight: 8,
        boxWidth: 8,
        color: chartTextColor,
        font: {family: "Handjet, system-ui, sans-serif", size: 15}
      }
    },
    tooltip: {
      backgroundColor: "rgba(25, 25, 25, 0.92)",
      borderColor: "rgba(200, 214, 250, 0.35)",
      borderWidth: 1,
      titleColor: chartTextColor,
      bodyColor: chartTextColor
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  },
  scales: {
    x: {
      grid: {display: false},
      stacked,
      ticks: {color: chartMutedColor}
    },
    y: {
      beginAtZero: true,
      grid: {color: chartGridColor},
      stacked,
      ticks: {color: chartMutedColor}
    }
  }
});

const commonHorizontalBarOpts = (): ChartOptions<"bar"> => ({
  ...commonBarOpts(false),
  indexAxis: "y",
  plugins: {
    ...commonBarOpts(false).plugins,
    legend: {
      display: false
    }
  }
});

const commonDoughnutOpts = (): ChartOptions<"doughnut"> => ({
  cutout: "62%",
  maintainAspectRatio: false,
  responsive: true,
  resizeDelay: 80,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxHeight: 8,
        boxWidth: 8,
        color: chartTextColor,
        font: {family: "Handjet, system-ui, sans-serif", size: 15}
      }
    },
    tooltip: {
      backgroundColor: "rgba(25, 25, 25, 0.92)",
      borderColor: "rgba(200, 214, 250, 0.35)",
      borderWidth: 1,
      titleColor: chartTextColor,
      bodyColor: chartTextColor
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  }
});

const getModeLabel = (mode?: string) =>
  getGameModeLabelKey(
    mode === "reaction" || mode === "classic-speed" ? mode : DEFAULT_GAME_MODE
  );

type StatCardProps = {
  helper: string;
  icon: IconDefinition;
  label: string;
  tone: "blue" | "green" | "pink" | "violet";
  value: number | string;
};

type ChartPanelProps = {
  children: React.ReactNode;
  className?: string;
  helper: string;
  icon?: IconDefinition;
  tall?: boolean;
  title: string;
};

const toneStyles: Record<StatCardProps["tone"], string> = {
  blue: "from-primary-100 to-primary-200 text-primary-700 dark:from-primary-700 dark:to-primary-600 dark:text-primary-100",
  green:
    "from-emerald-100 to-emerald-200 text-emerald-900 dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-100",
  pink: "from-pink-100 to-pink-200 text-pink-900 dark:from-pink-950 dark:to-pink-900 dark:text-pink-100",
  violet:
    "from-violet-100 to-violet-200 text-violet-900 dark:from-violet-950 dark:to-violet-900 dark:text-violet-100"
};

const chartPanelClass =
  "rounded-lg border border-primary-300/40 bg-primary-700/90 p-4 shadow-sm backdrop-blur-[1px] dark:border-primary-300/25 dark:bg-primary-700/80";

const formatMetric = (value: number) =>
  new Intl.NumberFormat("en", {maximumFractionDigits: 1}).format(value);

const formatDateInput = (date: moment.Moment) => date.format("YYYY-MM-DD");

const formatRoomDate = (date: Date) => ({
  day: moment(date).format("DD/MM/YYYY"),
  time: moment(date).format("HH:mm")
});

const getFilterSummary = ({
  endDate,
  isAllRange,
  isDefaultRange,
  startDate
}: {
  endDate?: string | null;
  isAllRange: boolean;
  isDefaultRange: boolean;
  startDate?: string | null;
}) => {
  if (isAllRange) return "All closed rooms";
  if (isDefaultRange) return "Last 7 days";
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `Until ${endDate}`;
  return "Last 7 days";
};

const hasChartValues = (data: {datasets: {data: unknown[]}[]}) =>
  data.datasets.some((dataset) =>
    dataset.data.some((value) => typeof value === "number" && value > 0)
  );

const Admin = () => {
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [currentRooms, setCurrentRooms] = useState(0);
  const [designPreferences, setDesignPreferences] = useState<
    DesignPreference[]
  >([]);
  const {user, loading} = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const startDate = params.get("start");
  const endDate = params.get("end");
  const isAllRange = params.get("range") === "all";
  const defaultStartDate = formatDateInput(moment().subtract(6, "days"));
  const defaultEndDate = formatDateInput(moment());
  const effectiveStartDate = isAllRange ? null : startDate ?? defaultStartDate;
  const effectiveEndDate = isAllRange ? null : endDate ?? defaultEndDate;
  const isDefaultRange = !isAllRange && !startDate && !endDate;
  const isAuthorized = Boolean(
    user?.email && ALLOWED_EMAILS.includes(user.email)
  );

  useEffect(() => {
    if (!loading && !isAuthorized) {
      router.replace("/");
    }
  }, [isAuthorized, loading, router]);

  useEffect(() => {
    if (loading || !isAuthorized) {
      return;
    }

    getRoomStats(effectiveStartDate, effectiveEndDate).then((rooms) =>
      setRooms(rooms)
    );
    const refGames = ref(getDatabase(), `games`);
    const unsubscribe = onValue(refGames, (snapshot) => {
      setCurrentRooms(snapshot.size);
    });
    getDesignPreferences().then((designPreferences) =>
      setDesignPreferences(designPreferences ?? [])
    );

    return unsubscribe;
  }, [effectiveEndDate, effectiveStartDate, isAuthorized, loading]);

  const todayRooms = rooms.filter((room) =>
    moment().isSame(room.created, "day")
  );
  const allGames = rooms.flatMap((room) => room.gamesPlayed);
  const classicGames = allGames.filter(
    (game) => (game.gameMode ?? DEFAULT_GAME_MODE) === "classic-speed"
  );
  const reactionGames = allGames.filter((game) => game.gameMode === "reaction");
  const reactionGamesWithFastest = reactionGames.filter(
    (game) => typeof game.fastestReactionMs === "number"
  );
  const todayGames = todayRooms.flatMap((room) => room.gamesPlayed);
  const avgGamesPerRoom = rooms.length > 0 ? allGames.length / rooms.length : 0;
  const avgPlayersPerGame =
    allGames.length > 0
      ? allGames.reduce((acc, game) => acc + game.numberOfUsers, 0) /
        allGames.length
      : 0;
  const avgRoomDurationMinutes =
    rooms.length > 0
      ? rooms.reduce(
          (acc, room) => acc + minutesBetween(room.created, room.removed),
          0
        ) / rooms.length
      : 0;
  const avgFastestReactionMs =
    reactionGamesWithFastest.length > 0
      ? reactionGamesWithFastest.reduce(
          (acc, game) => acc + (game.fastestReactionMs ?? 0),
          0
        ) / reactionGamesWithFastest.length
      : 0;
  const falseStartTotal = reactionGames.reduce(
    (acc, game) => acc + (game.falseStarts ?? 0),
    0
  );
  const filterSummary = getFilterSummary({
    endDate: effectiveEndDate,
    isAllRange,
    isDefaultRange,
    startDate: effectiveStartDate
  });

  const roomsAndPlayersData = useMemo(() => {
    const labels = [];
    const datasets: ChartDataset<"line", (number | Point | null)[]>[] = [];
    const sortedRooms = [...rooms].reverse();

    const playedGames: number[] = [];
    const roomsCreated: number[] = [];

    for (const room of sortedRooms) {
      const roomDate = moment(room.created);
      const day = roomDate.format("D/M/YY");

      const existingIndex = labels.indexOf(day);
      if (existingIndex !== -1) {
        playedGames[existingIndex] += room.gamesPlayed.length;
        roomsCreated[existingIndex]++;
      } else {
        labels.push(day);
        playedGames.push(room.gamesPlayed.length);
        roomsCreated.push(1);
      }
    }

    const commonOpts = {
      fill: true,
      tension: 0.3
    };

    datasets.push({
      label: "Rooms Created",
      data: roomsCreated,
      borderColor: "blue",
      backgroundColor: (ctx) => gradientFilter(ctx, "rgba(0, 76, 255, 0.58)"),
      ...commonOpts
    });
    datasets.push({
      label: "Games Played",
      data: playedGames,
      borderColor: "rgba(180,0,255,1)",
      backgroundColor: (ctx) => gradientFilter(ctx, "rgba(214,0,255,0.58)"),
      ...commonOpts
    });
    datasets.push({
      label: "Average",
      data: calculateAverage(roomsCreated, playedGames),
      borderColor: "rgba(185, 36, 36, 0.58)",
      borderDash: [10],
      borderWidth: 1
    });

    return {labels, datasets};
  }, [rooms]);

  const playersPerGameData = useMemo(() => {
    const labels = [];
    const datasets: ChartDataset<"bar", (number | Point | null)[]>[] = [];
    const totalPlayers: number[] = [];
    const totalGames: number[] = [];
    const sortedRooms = [...rooms].reverse();

    for (const room of sortedRooms) {
      const roomDate = moment(room.created);
      const day = roomDate.format("D/M/YY");

      const existingIndex = labels.indexOf(day);
      if (existingIndex === -1) {
        labels.push(day);
      }

      for (const game of room.gamesPlayed) {
        const index = labels.indexOf(day);
        if (totalPlayers[index]) {
          totalPlayers[index] += game.numberOfUsers;
          totalGames[index]++;
        } else {
          totalPlayers[index] = game.numberOfUsers;
          totalGames[index] = 1;
        }
      }
    }

    datasets.push({
      label: "Avg players per game",
      data: labels.map((_, i) => totalPlayers[i] / totalGames[i]),
      borderColor: "rgb(0, 255, 187)",
      borderWidth: 1,
      backgroundColor: (ctx) => gradientFilter(ctx, "rgba(0, 255, 187,0.5)")
    });

    return {labels, datasets};
  }, [rooms]);

  const gamesData = useMemo(() => {
    const datasets: ChartDataset<"bar", (number | Point | null)[]>[] = [];
    const labels = classicGames.map((_, index) => `G${index + 1}`);
    const clicks = [];
    const numberOfUsers = [];
    const timers = [];

    for (const game of classicGames) {
      clicks.push(game.timer > 0 ? game.maxClicks / game.timer : 0);
      numberOfUsers.push(game.numberOfUsers);
      timers.push(game.timer);
    }

    datasets.push({
      label: `Number of users`,
      data: numberOfUsers,
      backgroundColor: "rgb(255, 70, 70)"
    });
    datasets.push({
      label: `Clicks`,
      data: clicks,
      backgroundColor: "rgb(90, 255, 84)"
    });
    datasets.push({
      label: `timer`,
      data: timers,
      backgroundColor: "rgb(89, 67, 255)"
    });

    return {labels, datasets};
  }, [classicGames]);

  const reactionOutcomesData = useMemo(() => {
    const validReactions = reactionGames.reduce(
      (acc, game) => acc + (game.validReactions ?? 0),
      0
    );
    const falseStarts = reactionGames.reduce(
      (acc, game) => acc + (game.falseStarts ?? 0),
      0
    );
    const noReactions = reactionGames.reduce(
      (acc, game) => acc + (game.noReactions ?? 0),
      0
    );

    return {
      labels: ["Valid", "False start", "No reaction"],
      datasets: [
        {
          label: "Players",
          data: [validReactions, falseStarts, noReactions],
          backgroundColor: [
            "rgba(0, 255, 187, 0.35)",
            "rgba(255, 99, 132, 0.35)",
            "rgba(200, 214, 250, 0.22)"
          ],
          borderColor: [
            "rgb(0, 255, 187)",
            "rgb(255, 99, 132)",
            "rgba(200, 214, 250, 0.75)"
          ],
          borderWidth: 1
        }
      ]
    };
  }, [reactionGames]);

  const reactionInputData = useMemo(() => {
    const clickInputs = reactionGames.reduce(
      (acc, game) => acc + (game.clickInputs ?? 0),
      0
    );
    const tapInputs = reactionGames.reduce(
      (acc, game) => acc + (game.tapInputs ?? 0),
      0
    );
    const keyInputs = reactionGames.reduce(
      (acc, game) => acc + (game.keyInputs ?? 0),
      0
    );

    return {
      labels: ["Click", "Tap", "Key"],
      datasets: [
        {
          label: "Inputs",
          data: [clickInputs, tapInputs, keyInputs],
          backgroundColor: [
            "rgba(89, 67, 255, 0.35)",
            "rgba(0, 255, 187, 0.35)",
            "rgba(255, 214, 10, 0.35)"
          ],
          borderColor: [
            "rgb(89, 67, 255)",
            "rgb(0, 255, 187)",
            "rgb(255, 214, 10)"
          ],
          borderWidth: 1
        }
      ]
    };
  }, [reactionGames]);

  const roomCapacityData = useMemo(() => {
    const counts = rooms.reduce<Record<string, number>>((acc, room) => {
      const capacity = room.maxUsersConfigured ?? room.maxUsersConnected;
      const label = `${capacity} players`;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: "Rooms",
          data: Object.values(counts),
          backgroundColor: "rgba(200, 214, 250, 0.3)",
          borderColor: "rgba(200, 214, 250, 0.8)",
          borderWidth: 1
        }
      ]
    };
  }, [rooms]);

  const gamesByModeData = useMemo(() => {
    const counts = rooms
      .flatMap((room) =>
        room.gamesPlayed.map((game) => game.gameMode ?? room.gameMode)
      )
      .reduce<Record<string, number>>((acc, mode) => {
        const normalizedMode = getModeLabel(mode);
        acc[normalizedMode] = (acc[normalizedMode] ?? 0) + 1;
        return acc;
      }, {});

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: "Games",
          data: Object.values(counts),
          backgroundColor: [
            "rgba(89, 67, 255, 0.35)",
            "rgba(0, 255, 187, 0.35)"
          ],
          borderColor: ["rgb(89, 67, 255)", "rgb(0, 255, 187)"],
          borderWidth: 1
        }
      ]
    };
  }, [rooms]);

  const designPreferencesData = useMemo(() => {
    const datasets: ChartDataset<"doughnut", (number | Point | null)[]>[] = [];
    const labels = ["Yes", "No"];

    const data = designPreferences.reduce(
      (acc, dp) => {
        acc[dp.likesNewDesign ? 0 : 1] += 1;
        return acc;
      },
      [0, 0]
    );

    datasets.push({
      label: "Votes",
      data,
      backgroundColor: ["rgba(54, 162, 235, 0.2)", "rgba(255, 99, 132, 0.2)"],
      borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
      borderWidth: 1
    });

    return {labels, datasets};
  }, [designPreferences]);

  if (loading || !isAuthorized) return <Loading />;

  const replaceSearch = (search: URLSearchParams) => {
    const queryString = search.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleChangeDate = (value: string, field: "start" | "end") => {
    const search = new URLSearchParams(params);
    search.delete("range");
    if (value) {
      search.set(field, value);
      if (
        field === "start" &&
        search.get("end") &&
        moment(value).isAfter(search.get("end"))
      ) {
        search.set("end", value);
      } else if (
        field === "end" &&
        search.get("start") &&
        moment(value).isBefore(search.get("start"))
      ) {
        search.set("start", value);
      }
    } else {
      search.delete(field);
    }
    replaceSearch(search);
  };

  const handleQuickRange = (days: number) => {
    const search = new URLSearchParams(params);
    const end = moment();
    const start = moment().subtract(days - 1, "days");

    search.delete("range");
    search.set("start", formatDateInput(start));
    search.set("end", formatDateInput(end));
    replaceSearch(search);
  };

  const handleAllTime = () => {
    const search = new URLSearchParams(params);
    search.delete("start");
    search.delete("end");
    search.set("range", "all");
    replaceSearch(search);
  };

  return (
    <main className="admin-grid-background min-h-dvh overflow-y-auto p-3 text-primary-700 dark:text-primary-100 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-lg border border-primary-300/40 bg-primary-100/85 p-4 shadow-sm backdrop-blur-[1px] dark:border-primary-300/25 dark:bg-primary-700/65 md:p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-primary-400 dark:text-primary-200">
                Admin
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-none md:text-5xl">
                Room analytics
              </h1>
              <p className="mt-2 text-base text-primary-500/80 dark:text-primary-100/70 md:text-xl">
                Closed room history, game mix, and live room count.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:max-w-2xl">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-bold uppercase text-primary-500 dark:text-primary-100">
                  From
                  <input
                    type="date"
                    className="h-11 rounded-md border border-primary-300 bg-primary-50 px-3 text-base text-primary-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-300/40 dark:bg-primary-700 dark:text-primary-100"
                    value={effectiveStartDate || ""}
                    onChange={(e) => handleChangeDate(e.target.value, "start")}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase text-primary-500 dark:text-primary-100">
                  To
                  <input
                    type="date"
                    className="h-11 rounded-md border border-primary-300 bg-primary-50 px-3 text-base text-primary-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-300/40 dark:bg-primary-700 dark:text-primary-100"
                    value={effectiveEndDate || ""}
                    onChange={(e) => handleChangeDate(e.target.value, "end")}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 7, 30].map((days) => (
                  <button
                    className="rounded-md border border-primary-300 px-3 py-2 text-sm font-bold uppercase text-primary-500 transition hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300/40 dark:text-primary-100 dark:hover:bg-primary-600"
                    key={days}
                    onClick={() => handleQuickRange(days)}
                    type="button"
                  >
                    {days === 1 ? "Today" : `${days} days`}
                  </button>
                ))}
                <button
                  className="rounded-md border border-primary-300 px-3 py-2 text-sm font-bold uppercase text-primary-500 transition hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300/40 dark:text-primary-100 dark:hover:bg-primary-600"
                  onClick={handleAllTime}
                  type="button"
                >
                  All history
                </button>
                <span className="ml-auto text-sm font-bold text-primary-500/70 dark:text-primary-100/60">
                  {filterSummary}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            helper="Realtime database"
            icon={faDoorOpen}
            label="Current rooms"
            tone="blue"
            value={currentRooms}
          />
          <StatCard
            helper={`${todayRooms.length} created today`}
            icon={faDoorClosed}
            label="Rooms in range"
            tone="green"
            value={rooms.length}
          />
          <StatCard
            helper={`${todayGames.length} today / ${formatMetric(
              avgGamesPerRoom
            )} per room`}
            icon={faGamepad}
            label="Games in range"
            tone="pink"
            value={allGames.length}
          />
          <StatCard
            helper={`${formatMetric(avgPlayersPerGame)} avg players/game`}
            icon={faChartLine}
            label="Avg duration"
            tone="violet"
            value={`${formatMetric(avgRoomDurationMinutes)}m`}
          />
          <StatCard
            helper={`${reactionGames.length} reaction games`}
            icon={faBolt}
            label="Avg reaction"
            tone="blue"
            value={
              reactionGamesWithFastest.length > 0
                ? `${formatMetric(avgFastestReactionMs)}ms`
                : "--"
            }
          />
          <StatCard
            helper="Reaction Battle early inputs"
            icon={faGamepad}
            label="False starts"
            tone="green"
            value={falseStartTotal}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ChartPanel
            icon={faChartLine}
            helper="Rooms closed and games completed, grouped by day."
            tall
            title="Rooms vs games"
          >
            {roomsAndPlayersData.labels.length > 0 ? (
              <Line data={roomsAndPlayersData} options={commonLineOpts()} />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel
            icon={faGamepad}
            helper="Average number of players per finished game."
            tall
            title="Player density"
          >
            {playersPerGameData.labels.length > 0 ? (
              <Bar data={playersPerGameData} options={commonBarOpts()} />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <ChartPanel
            helper="Classic clicks per second, player count, and timer."
            icon={faMousePointer}
            title="Classic game data"
          >
            {gamesData.labels.length > 0 ? (
              <Bar data={gamesData} options={commonBarOpts(true)} />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel
            helper="Finished games by mode."
            icon={faLayerGroup}
            title="Games by mode"
          >
            {gamesByModeData.labels.length > 0 ? (
              <Doughnut data={gamesByModeData} options={commonDoughnutOpts()} />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel
            helper="Stored feedback from the design preference prompt."
            icon={faChartLine}
            title="Design feedback"
          >
            {designPreferences.length > 0 ? (
              <Doughnut
                data={designPreferencesData}
                options={commonDoughnutOpts()}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <ChartPanel
            helper="Player outcomes across finished Reaction Battle rounds."
            icon={faBolt}
            title="Reaction outcomes"
          >
            {hasChartValues(reactionOutcomesData) ? (
              <Bar
                data={reactionOutcomesData}
                options={commonHorizontalBarOpts()}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel
            helper="How players reacted: mouse, touch, or keyboard."
            icon={faKeyboard}
            title="Reaction inputs"
          >
            {hasChartValues(reactionInputData) ? (
              <Doughnut
                data={reactionInputData}
                options={commonDoughnutOpts()}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel
            helper="Configured room capacity in closed sessions."
            icon={faDoorClosed}
            title="Room capacity"
          >
            {hasChartValues(roomCapacityData) ? (
              <Bar data={roomCapacityData} options={commonBarOpts()} />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
        </section>

        <section className="overflow-hidden rounded-lg border border-primary-300/45 bg-primary-50/95 shadow-sm backdrop-blur-[1px] dark:border-primary-200/30 dark:bg-[#121216]">
          <div className="flex flex-col gap-1 border-b border-primary-300/30 bg-primary-100/75 p-4 dark:border-primary-200/25 dark:bg-[#1c1c22] md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-4xl">Rooms</h2>
              <p className="text-sm text-primary-500/80 dark:text-primary-100/85">
                Closed room sessions matching the selected filters.
              </p>
            </div>
            <span className="rounded-md border border-primary-300/35 bg-primary-50/70 px-3 py-1.5 text-sm font-bold uppercase text-primary-500 dark:border-primary-200/35 dark:bg-primary-700/80 dark:text-primary-50">
              {rooms.length} rows
            </span>
          </div>

          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[980px] table-fixed text-left font-sans text-sm leading-5 text-primary-700 dark:text-primary-50">
              <thead className="sticky top-0 z-10 border-b border-primary-300/35 bg-primary-200 text-xs font-semibold uppercase text-primary-500 shadow-sm dark:border-primary-200/35 dark:bg-[#24242b] dark:text-primary-100">
                <tr>
                  <th className="w-[20%] px-4 py-3" scope="col">
                    Name
                  </th>
                  <th className="w-[13%] px-4 py-3" scope="col">
                    Mode
                  </th>
                  <th className="w-[7%] px-3 py-3 text-right" scope="col">
                    Peak
                  </th>
                  <th className="w-[7%] px-3 py-3 text-right" scope="col">
                    Limit
                  </th>
                  <th className="w-[7%] px-3 py-3 text-right" scope="col">
                    Games
                  </th>
                  <th className="w-[13%] px-4 py-3" scope="col">
                    Owner
                  </th>
                  <th className="w-[10%] px-4 py-3" scope="col">
                    Created
                  </th>
                  <th className="w-[10%] px-4 py-3" scope="col">
                    Deleted
                  </th>
                  <th className="w-[8%] px-3 py-3 text-right" scope="col">
                    Duration
                  </th>
                  <th className="w-[7%] px-3 py-3 text-center" scope="col">
                    Pass
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-300/15 dark:divide-primary-200/20">
                {rooms.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-primary-500/70 dark:text-primary-100/80"
                      colSpan={10}
                    >
                      No rooms match this range.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr
                      className="bg-primary-50/85 transition odd:bg-primary-100/55 hover:bg-primary-200/70 dark:bg-[#18181d] dark:odd:bg-[#202027] dark:hover:bg-primary-700/80"
                      key={room.id}
                    >
                      <td className="px-4 py-4">
                        <span className="block truncate font-semibold text-primary-700 dark:text-primary-50">
                          {room.name || "Unnamed room"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ModePill mode={getModeLabel(room.gameMode)} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {room.maxUsersConnected}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {room.maxUsersConfigured ?? room.maxUsersConnected}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {room.gamesPlayed.length}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block truncate text-primary-600 dark:text-primary-100">
                          {room.owner || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TimestampCell date={room.created} />
                      </td>
                      <td className="px-4 py-3">
                        <TimestampCell date={room.removed} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {minutesBetween(room.created, room.removed)} min
                      </td>
                      <td className="px-3 py-3 text-center">
                        {room.withPassword ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

function StatCard({helper, icon, label, tone, value}: StatCardProps) {
  return (
    <article
      className={`rounded-lg border border-primary-300/35 bg-gradient-to-br p-4 shadow-sm ${toneStyles[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase opacity-70">{label}</p>
          <p className="mt-2 text-4xl font-bold leading-none md:text-5xl">
            {value}
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-md border border-current/25 bg-current/10">
          <FontAwesomeIcon className="text-lg" icon={icon} />
        </div>
      </div>
      <p className="mt-4 text-sm font-bold opacity-75">{helper}</p>
    </article>
  );
}

function ChartPanel({
  children,
  className = "",
  helper,
  icon = faLayerGroup,
  tall = false,
  title
}: ChartPanelProps) {
  return (
    <article className={`${chartPanelClass} ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
            {title}
          </h2>
          <p className="text-sm text-primary-100/60">{helper}</p>
        </div>
        <FontAwesomeIcon className="mt-1 text-primary-200/70" icon={icon} />
      </div>
      <div className={tall ? "h-[330px] min-h-0" : "h-[280px] min-h-0"}>
        {children}
      </div>
    </article>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-primary-300/35 text-sm font-bold uppercase text-primary-100/45">
      No data for this range
    </div>
  );
}

function ModePill({mode}: {mode: string}) {
  return (
    <span className="inline-flex max-w-full rounded-md border border-primary-300/50 bg-primary-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase leading-4 text-primary-500 dark:border-primary-200/45 dark:bg-primary-600/65 dark:text-primary-50">
      {mode}
    </span>
  );
}

function TimestampCell({date}: {date: Date}) {
  const {day, time} = formatRoomDate(date);

  return (
    <span className="flex flex-col gap-0.5 tabular-nums">
      <span className="text-primary-700 dark:text-primary-50">{day}</span>
      <span className="text-xs text-primary-500/70 dark:text-primary-200">
        {time}
      </span>
    </span>
  );
}

export default Admin;
