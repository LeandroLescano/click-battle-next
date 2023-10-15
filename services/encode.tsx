export const sha256 = async (password: string) => {
  if (password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = Array.prototype.map
      .call(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (x) =>
        ("0" + x.toString(16)).slice(-2)
      )
      .join("");
    return hash;
  }
  return "";
};
