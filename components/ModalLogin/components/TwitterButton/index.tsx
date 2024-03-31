import React from "react";

interface TwitterButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

const TwitterButton = ({onClick}: TwitterButtonProps) => {
  return (
    <button
      className="login-button d-flex justify-content-center align-items-center"
      onClick={onClick}
    >
      <div className="login-button-icon d-flex justify-content-center align-items-center">
        <img src="/icons/twitter.svg" />
      </div>
    </button>
  );
};

export default TwitterButton;
