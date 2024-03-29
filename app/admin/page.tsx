"use client";

import React, {useEffect, useMemo, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {Card, CardBody, Col, Row, Table} from "react-bootstrap";
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
  BarElement
} from "chart.js";
import {Bar, Line} from "react-chartjs-2";
import moment from "moment";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faDoorClosed,
  faDoorOpen,
  faGamepad
} from "@fortawesome/free-solid-svg-icons";
import {getDatabase, onValue, ref} from "firebase/database";
import {_DeepPartialArray} from "chart.js/dist/types/utils";

import Loading from "components/Loading";
import {useAuth} from "contexts/AuthContext";
import {RoomStats} from "interfaces/RoomStats";
import {getRoomStats} from "services/rooms";
import {formatDate, minutesBetween} from "utils/date";

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

const Admin = () => {
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [currentRooms, setCurrentRooms] = useState(0);
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
      onValue(refGames, (snapshot) => {
        setCurrentRooms(snapshot.size);
      });
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
    <div className="h-100 overflow-y-auto p-2">
      <div className="input-group mb-3" data-bs-theme="dark">
        <span className="input-group-text">From</span>
        <input
          type="date"
          className="form-control"
          value={params.get("start") || ""}
          onChange={(e) => handleChangeDate(e.target.value, "start")}
        />
        <span className="input-group-text">To</span>
        <input
          type="date"
          className="form-control"
          value={params.get("end") || ""}
          onChange={(e) => handleChangeDate(e.target.value, "end")}
        />
      </div>
      <Row className="mb-3">
        <Col sm={4}>
          <Card bg="dark" text="white">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <FontAwesomeIcon icon={faDoorOpen} size="3x" />
              <div className="d-flex align-items-end flex-column">
                <Card.Text className="mb-0">current rooms</Card.Text>
                <Card.Text className="mb-0 fs-2">{currentRooms}</Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={4}>
          <Card bg="dark" text="white">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <FontAwesomeIcon icon={faDoorClosed} size="3x" />
              <div className="d-flex align-items-end flex-column">
                <Card.Text className="mb-0">Rooms created today</Card.Text>
                <Card.Text className="mb-0 fs-2">{todayRooms.length}</Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={4}>
          <Card bg="dark" text="white">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <FontAwesomeIcon icon={faGamepad} size="3x" />
              <div className="d-flex align-items-end flex-column">
                <Card.Text className="mb-0">Games played today</Card.Text>
                <Card.Text className="mb-0 fs-2">
                  {todayRooms.flatMap((room) => room.gamesPlayed).length}
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col sm={6}>
          <Card bg="dark">
            <CardBody>
              <Line
                options={commonLineOpts("Rooms created vs games played")}
                data={roomsAndPlayersData}
              />
            </CardBody>
          </Card>
        </Col>
        <Col sm={6}>
          <Card bg="dark">
            <CardBody>
              <Bar
                options={commonBarOpts("Avg players per game")}
                data={playersPerGameData}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col sm={6}>
          <Card bg="dark">
            <CardBody>
              <Bar options={commonBarOpts("Game data")} data={gamesData} />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>Name</th>
            <th>Max Players</th>
            <th>Games played</th>
            <th>Owner</th>
            <th>Created</th>
            <th>Deleted</th>
            <th>Open</th>
            <th>Password</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.name}</td>
              <td>{room.maxUsersConnected}</td>
              <td>{room.gamesPlayed.length}</td>
              <td>{room.owner}</td>
              <td>{formatDate(room.created, "es")}</td>
              <td>{formatDate(room.removed, "es")}</td>
              <td>{minutesBetween(room.created, room.removed)} min</td>
              <td>{room.withPassword ? "Si" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Admin;
