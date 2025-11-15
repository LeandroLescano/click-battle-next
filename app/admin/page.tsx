"use client";

import React, {useEffect, useMemo, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
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
import {Bar, Line, Doughnut} from "react-chartjs-2";
import moment from "moment";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faDoorClosed,
  faDoorOpen,
  faGamepad
} from "@fortawesome/free-solid-svg-icons";
import {getDatabase, onValue, ref} from "firebase/database";

import {Loading} from "components-new/Loading";
import {useAuth} from "contexts/AuthContext";
import {RoomStats} from "interfaces/RoomStats";
import {getRoomStats} from "services/rooms";
import {formatDate, minutesBetween} from "utils/date";
import {DesignPreference} from "interfaces/DesignPreferences";
import {getDesignPreferences} from "services/experience";

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

const commonLineOpts = (title?: string): ChartOptions<"line"> => ({
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: title
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  }
});

const commonBarOpts = (title?: string): ChartOptions<"bar"> => ({
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: title
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  },
  scales: {
    x: {
      stacked: true
    }
  }
});

const commonDoughnutOpts = (title?: string): ChartOptions<"doughnut"> => ({
  plugins: {
    title: {
      display: true,
      text: title
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  }
});

const Admin = () => {
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [currentRooms, setCurrentRooms] = useState(0);
  const [designPreferences, setDesignPreferences] = useState<
    DesignPreference[]
  >([]);
  const {user, loading} = useAuth();
  const router = useRouter();
  const db = getDatabase();
  const params = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user?.email) {
      getRoomStats(params.get("start"), params.get("end")).then((rooms) =>
        setRooms(rooms)
      );
      const refGames = ref(db, `games`);
      const unsubscribe = onValue(refGames, (snapshot) => {
        setCurrentRooms(snapshot.size);
      });
      getDesignPreferences().then((designPreferences) =>
        setDesignPreferences(designPreferences ?? [])
      );

      return unsubscribe;
    }
  }, [loading, params]);

  const todayRooms = rooms.filter((room) =>
    moment().isSame(room.created, "day")
  );

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
    const sortedRooms = [...rooms].reverse();
    const labels = [
      ...Array(sortedRooms.flatMap((room) => room.gamesPlayed).length).keys()
    ];
    const clicks = [];
    const numberOfUsers = [];
    const timers = [];

    for (const game of sortedRooms.flatMap((room) => room.gamesPlayed)) {
      clicks.push(game.maxClicks / game.timer);
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

  if (loading) return <Loading />;

  if (!user?.email || !ALLOWED_EMAILS.includes(user.email)) router.push("/");

  const handleChangeDate = (value: string, field: "start" | "end") => {
    const search = new URLSearchParams(params);
    if (value) {
      search.set(field, value);
      if (field === "start" && moment(value).isAfter(search.get("end"))) {
        search.set("end", value);
      } else if (
        field === "end" &&
        moment(value).isBefore(search.get("start"))
      ) {
        search.set("start", value);
      }
    } else {
      search.delete(field);
    }
    router.replace(`${pathname}?${search.toString()}`);
  };

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="relative mb-4 flex w-full flex-wrap items-stretch dark:bg-primary-700">
        <span className="flex items-center whitespace-nowrap border rounded-s border-x-0 border-solid border-neutral-200 px-3 py-[0.25rem] text-center text-base font-normal leading-[1.6] text-surface dark:border-white/10 dark:text-white">
          FROM
        </span>
        <input
          type="date"
          className="relative m-0 block flex-auto border border-solid border-neutral-200 bg-transparent bg-clip-padding px-3 py-[0.25rem] text-base font-normal leading-[1.6] text-surface outline-none transition duration-200 ease-in-out placeholder:text-neutral-500 focus:z-[3] focus:border-primary focus:shadow-inset focus:outline-none motion-reduce:transition-none dark:border-white/10 dark:text-white dark:placeholder:text-neutral-200 dark:autofill:shadow-autofill dark:focus:border-primary"
          value={params.get("start") || ""}
          onChange={(e) => handleChangeDate(e.target.value, "start")}
        />
        <span className="flex items-center whitespace-nowrap border border-x-0 border-solid border-neutral-200 px-3 py-[0.25rem] text-center text-base font-normal leading-[1.6] text-surface dark:border-white/10 dark:text-white">
          TO
        </span>
        <input
          type="date"
          className="relative m-0 block flex-auto rounded-e border border-solid border-neutral-200 bg-transparent bg-clip-padding px-3 py-[0.25rem] text-base font-normal leading-[1.6] text-surface outline-none transition duration-200 ease-in-out placeholder:text-neutral-500 focus:z-[3] focus:border-primary focus:shadow-inset focus:outline-none motion-reduce:transition-none dark:border-white/10 dark:text-white dark:placeholder:text-neutral-200 dark:autofill:shadow-autofill dark:focus:border-primary"
          value={params.get("end") || ""}
          onChange={(e) => handleChangeDate(e.target.value, "end")}
        />
      </div>
      <div className="mb-3 flex flex-row gap-4">
        <div className="w-full rounded-lg bg-primary-200 dark:bg-primary-600">
          <div className="dark:text-white p-4 rounded shadow-lg flex justify-between items-center">
            <FontAwesomeIcon icon={faDoorOpen} size="3x" />
            <div className="flex flex-col items-end">
              <p className="mb-0 text-3xl">Current rooms</p>
              <p className="mb-0 text-5xl">{currentRooms}</p>
            </div>
          </div>
        </div>
        <div className="w-full rounded-lg bg-primary-200 dark:bg-primary-600">
          <div className="dark:text-white p-4 rounded shadow-lg flex justify-between items-center">
            <FontAwesomeIcon icon={faDoorClosed} size="3x" />
            <div className="flex flex-col items-end">
              <p className="mb-0 text-3xl">Rooms created today</p>
              <p className="mb-0 text-5xl">{todayRooms.length}</p>
            </div>
          </div>
        </div>
        <div className="w-full rounded-lg bg-primary-200 dark:bg-primary-600">
          <div className="dark:text-white p-4 rounded shadow-lg flex justify-between items-center">
            <FontAwesomeIcon icon={faGamepad} size="3x" />
            <div className="flex flex-col items-end">
              <p className="mb-0 text-3xl">Games played today</p>
              <p className="mb-0 text-5xl">
                {todayRooms.flatMap((room) => room.gamesPlayed).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-row gap-4">
        <div className="w-full">
          <div className="bg-primary-700 p-4 rounded shadow-lg">
            <Line
              options={commonLineOpts("Rooms created vs games played")}
              data={roomsAndPlayersData}
            />
          </div>
        </div>
        <div className="w-full">
          <div className="bg-primary-700 p-4 rounded shadow-lg">
            <Bar
              options={commonBarOpts("Avg players per game")}
              data={playersPerGameData}
            />
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-row gap-4">
        <div className="w-full">
          <div className="bg-primary-700 p-4 rounded shadow-lg">
            <Bar options={commonBarOpts("Game data")} data={gamesData} />
          </div>
        </div>
        <div className="w-full">
          <div className="bg-primary-700 p-4 rounded shadow-lg">
            <Doughnut
              style={{maxHeight: "450px"}}
              options={commonDoughnutOpts("Users like the new design?")}
              data={designPreferencesData}
            />
          </div>
        </div>
      </div>

      <table className="w-full text-2xl text-left rtl:text-right text-gray-800 dark:text-white">
        <thead className=" text-gray-900 uppercase bg-primary-50 dark:bg-primary-700 dark:text-white border-b">
          <tr>
            <th scope="col">Name</th>
            <th scope="col" className="border-l px-2">
              Max Players
            </th>
            <th scope="col" className="border-l px-2">
              Games played
            </th>
            <th scope="col" className="border-l px-2">
              Owner
            </th>
            <th scope="col" className="border-l px-2">
              Created
            </th>
            <th scope="col" className="border-l px-2">
              Deleted
            </th>
            <th scope="col" className="border-l px-2">
              Open
            </th>
            <th scope="col" className="border-l px-2">
              Password
            </th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr
              className="odd:bg-white odd:dark:bg-gray-800 even:bg-primary-50 even:dark:bg-gray-700 border-b dark:border-primary-700"
              key={room.id}
            >
              <td>{room.name}</td>
              <td className="border-l px-2">{room.maxUsersConnected}</td>
              <td className="border-l px-2">{room.gamesPlayed.length}</td>
              <td className="border-l px-2">{room.owner}</td>
              <td className="border-l px-2">
                {formatDate(room.created, "es")}
              </td>
              <td className="border-l px-2">
                {formatDate(room.removed, "es")}
              </td>
              <td className="border-l px-2">
                {minutesBetween(room.created, room.removed)} min
              </td>
              <td className="border-l">{room.withPassword ? "Si" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
