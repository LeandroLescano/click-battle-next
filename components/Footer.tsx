import React from "react";

type User = {
  username: string;
  clicks?: number;
  rol?: string;
  maxScore?: number;
  key?: string;
  email?: string;
};

type AppProps = {
  user: User;
  handleLogOut: Function;
};

function Footer({ user, handleLogOut }: AppProps) {
  return (
    <footer className="mt-auto d-flex flex-column-reverse flex-md-row justify-content-centers justify-content-md-between w-100 align-items-baseline">
      <div className="footer mx-auto mx-md-0">
        <a
          href="https://cafecito.app/leanlescano"
          rel="noreferrer"
          target="_blank"
        >
          <img
            srcSet="https://cdn.cafecito.app/imgs/buttons/button_2.png 1x, https://cdn.cafecito.app/imgs/buttons/button_2_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_2_3.75x.png 3.75x"
            src="https://cdn.cafecito.app/imgs/buttons/button_2.png"
            alt="Invitame un café en cafecito.app"
          />
        </a>
      </div>
      {user.username !== "" && (
        <div className="txt-user text-center mx-auto mx-md-0">
          logged as {user.username} -{" "}
          <button
            className="btn-logout btn-click"
            onClick={() => handleLogOut()}
          >
            Log out
          </button>
        </div>
      )}
    </footer>
  );
}

export default Footer;
