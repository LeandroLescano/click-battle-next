import React from "react";

interface GoogleButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

const GoogleButton = ({onClick}: GoogleButtonProps) => {
  return (
    <button
      className="login-button d-flex justify-content-center align-items-center"
      onClick={onClick}
    >
      <div className="login-button-icon d-flex justify-content-center align-items-center">
        <img src="/icons/google.svg" />
      </div>
    </button>
  );
};

export default GoogleButton;
