import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export const loginWithGoogleAlert = () => {
  Swal.fire({
    icon: "warning",
    title: "You are logged as anonymous",
    text: "Please sign in with Google to give us feedback",
    heightAuto: false
  });
};

export const loadingAlert = (title: string) => {
  Swal.fire({
    title: title,
    heightAuto: false
  });
  Swal.showLoading();
};

export const ReactSwal = withReactContent(
  Swal.mixin({
    heightAuto: false
  })
);
