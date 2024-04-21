import React from "react";

type CardGameProps = {
  children: React.ReactNode;
};

export const CardGameAd = ({children}: CardGameProps) => {
  if (!children) return <></>;

  return (
    <div className="col col-card mb-3">
      <div className="card card-room shadow-sm">{children}</div>
    </div>
  );
};
