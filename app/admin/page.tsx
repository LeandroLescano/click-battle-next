"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Table} from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import Loading from "components/Loading";
import {useAuth} from "contexts/AuthContext";
import {RoomStats} from "interfaces/RoomStats";
import {getRoomStats} from "services/rooms";
import {formatDate, minutesBetween} from "utils/date";

const ALLOWED_EMAILS = [
  "tatilescano11@gmail.com",
  "leandrolescano11@gmail.com"
];

const Admin = () => {
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const {user, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.email) {
      getRoomStats().then((rooms) => setRooms(rooms));
    }
  }, [loading]);

  if (loading) return <Loading />;

  if (!user?.email || !ALLOWED_EMAILS.includes(user.email)) router.push("/");

  return (
    <div className="h-100 overflow-y-auto p-2">
      <ResponsiveContainer>
        <LineChart
          width={500}
          height={300}
          data={rooms
            .sort((a, b) => a.created.getTime() - b.created.getTime())
            .map((room) => ({
              ...room,
              created: formatDate(room.created, "es")
            }))}
        >
          <CartesianGrid strokeDasharray="2 2" strokeOpacity={0.2} />
          <XAxis dataKey="created" />
          <YAxis />
          <Tooltip contentStyle={{backgroundColor: "black"}} />
          <Legend />
          <Line
            type="monotone"
            dataKey="gamesPlayed.length"
            name="Games played"
            stroke="#8884d8"
            activeDot={{r: 5}}
          />
          <Line
            type="monotone"
            dataKey="maxUsersConnected"
            name="Max users"
            stroke="#82ca9d"
          />
        </LineChart>
      </ResponsiveContainer>
      <Table striped bordered hover variant="dark">
        <thead>
          <th>Name</th>
          <th>Max Players</th>
          <th>Games played</th>
          <th>Owner</th>
          <th>Created</th>
          <th>Deleted</th>
          <th>Open</th>
          <th>Password</th>
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
