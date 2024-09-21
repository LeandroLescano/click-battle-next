import React from "react";

import "./styles.scss";

interface SocialButtonProps {
  variant: "google" | "github" | "twitter";
  onClick?: VoidFunction;
}

const SocialButton = ({variant, onClick}: SocialButtonProps) => {
  return (
    <button
      className="login-button flex justify-center items-center"
      onClick={onClick}
    >
      <div className="login-button-icon flex justify-center items-center">
        <img src={`/icons/${variant}.svg`} width={40} />
      </div>
    </button>
  );
};

export default SocialButton;
