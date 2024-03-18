import React from "react";

interface GithubButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

const GithubButton = ({onClick}: GithubButtonProps) => {
  return (
    <button
      className="login-button d-flex justify-content-center align-items-center"
      onClick={onClick}
    >
      <div className="login-button-icon d-flex justify-content-center align-items-center">
        <img src="/icons/github.svg" />
      </div>
    </button>
  );
};

export default GithubButton;
