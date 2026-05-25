"use client";

import dynamic from "next/dynamic";

type UpdatedTimeProps = {
  text: string;
  date: Date;
};

const UpdatedTimeNoSsr = dynamic<UpdatedTimeProps>(
  () => import("components/UpdatedTime"),
  {
    ssr: false
  }
);

export default UpdatedTimeNoSsr;
