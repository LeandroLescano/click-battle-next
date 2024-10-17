import Swal, {SweetAlertResult} from "sweetalert2";
import {TFunction} from "i18next";

import {sha256} from "services/encode";

export const requestPassword = async (
  password: string,
  t: TFunction
): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: t("Enter the password"),
    input: "password",
    inputAttributes: {
      autocomplete: "new-password"
    },
    showCancelButton: true,
    cancelButtonText: t("Cancel"),
    confirmButtonText: t("Enter"),
    reverseButtons: true,
    inputValidator: (val) => {
      if (!val) {
        return t("Please enter the password");
      }
      return null;
    },
    showLoaderOnConfirm: true,
    preConfirm: (pass) => {
      return sha256(pass).then((hash) => {
        if (hash !== password) {
          Swal.showValidationMessage("Incorrect password");
          return false;
        }
        return true;
      });
    }
  }).then((val) => val);
};
