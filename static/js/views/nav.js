document.addEventListener("DOMContentLoaded", () => {
  const navBtn = document.querySelector(".nav__home--menu");
  const exitNavBtn = document.querySelector(".nav__shown--exit");
  const navEl = document.querySelector(".nav__shown");
  const otherDocs = [
    document.querySelector(".nav__home"),
    document.querySelector(".home__main"),
  ];

  navBtn?.addEventListener("click", () => {
    navEl?.classList.add("active");
    otherDocs.forEach((el) => (el.style.display = "none"));
  });

  exitNavBtn?.addEventListener("click", () => {
    navEl?.classList.remove("active");
    otherDocs.forEach((el) => (el.style.display = "flex"));
  });
});
