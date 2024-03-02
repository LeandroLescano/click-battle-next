import React from "react";

const Test = () => {
  return (
    <button
      onClick={() => {
        const a = null;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        a.crash();
      }}
    >
      Test
    </button>
  );
};

export default Test;
