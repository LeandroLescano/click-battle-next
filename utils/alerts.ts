import Swal from "sweetalert2";

export const loginWithGoogleAlert = () => {
  Swal.fire({
    icon: "warning",
    title: "You are logged as anonymous",
    text: "Please sign in with Google to give us feedback"
  });
};

export const loadingAlert = (title: string) => {
  Swal.fire({
    title: title
  });
  Swal.showLoading();
};
