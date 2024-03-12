"use client";
import React from "react";

interface UpdatedTimeProps {
  text: string;
  date: Date;
}

const UpdatedTime = ({text, date}: UpdatedTimeProps) => {
  return (
    <span>
      {text} {date.toLocaleString()}
    </span>
  );
};

export default UpdatedTime;
