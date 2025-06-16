const adminInput = document.getElementById("register-admincode");
const registerBtn = document.getElementById("register-submit");
const adminError = document.getElementById("admincode-error");

adminInput.addEventListener("input", function () {
  if (adminInput.value === "1403") {
    registerBtn.disabled = false;
    adminError.style.display = "none";
  } else {
    registerBtn.disabled = true;
    adminError.style.display = "block";
  }
});
