import {TFunction} from "i18next";
import Swal from "sweetalert2";

export const handleInvite = (
  isMobile: boolean,
  t: TFunction,
  password?: string
) => {
  let link = window.location.href + `?invite=${Date.now() + 5 * 60 * 1000}`;
  if (password) {
    link += `&pwd=${password}`;
  }

  const data: ShareData = {
    title: "Click Battle",
    text: t("inviteText", {link})
  };

  if (isMobile && navigator.share && navigator.canShare(data)) {
    navigator.share(data).catch((e: unknown) => {
      console.error(e);
    });
  } else {
    navigator.clipboard.writeText(link);
    Swal.fire({
      toast: true,
      title: "Link copied to clipoard!",
      position: "bottom-left",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  }
};
