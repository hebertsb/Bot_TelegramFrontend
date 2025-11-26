window.addEventListener("load", () => {
  setTimeout(() => import("./app.js").then(({ init }) => init()), 100);
});
