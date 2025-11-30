window.addEventListener("load", () => {
  setTimeout(() => import("./app.js?v=3").then(({ init }) => init()), 100);
});
