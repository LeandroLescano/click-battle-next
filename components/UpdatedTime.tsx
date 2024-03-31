"use client";
import moment from "moment";
import React, {useEffect, useState} from "react";
import {ProgressBar} from "react-bootstrap";

interface UpdatedTimeProps {
  text: string;
  date: Date;
}

const UpdatedTime = ({text, date}: UpdatedTimeProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newTime =
        3600 - moment().diff(moment(date).add(1, "hour"), "seconds") * -1;
      setProgress(newTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [progress]);

  return (
    <div className="d-flex flex-column">
      <span>
        {text} {date.toLocaleString()}
      </span>
      <ProgressBar now={progress} max={3600} animated />
    </div>
  );
};

export default UpdatedTime;
