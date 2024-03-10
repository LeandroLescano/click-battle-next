import React from "react";

const Test = () => {
  return (
    <button
      onClick={() => {
        const a = null;
        a.crash();
      }}
    >
      Test
    </button>
  );
};

export default Test;
