var USERNAME_CHECK;
var USERNAME_CHECK_ERROR;

function OnRegisterLoad(){
    navload();
    let usernameLabel = document.getElementById("username-label");
    let passwordLabel = document.getElementById("password-label");
    let usernameTxt = document.getElementById("username");
    let passwordTxt = document.getElementById("password");

    let showButton = document.getElementById("show-password");

    usernameTxt.addEventListener("change", () => {
        if (usernameTxt.value != "" && usernameTxt.value != null && usernameTxt.value != undefined) {
            usernameLabel.classList.add("label-shrink");
        } else {
            usernameLabel.classList.remove("label-shrink");
        }
    });
    passwordTxt.addEventListener("input", () => {
        if (passwordTxt.value != "" && passwordTxt.value != null && passwordTxt.value != undefined) {
            passwordLabel.classList.add("label-shrink");
            showButton.style.visibility = "visible";
        } else {
            passwordLabel.classList.remove("label-shrink");
            showButton.style.visibility = "hidden";
        }
    });
}

function ShowPassword(){
    let showButton = document.getElementById("show-password");
    let passwordTxt = document.getElementById("password");

    if (showButton.classList.contains("fa-eye")){
        showButton.classList.remove("fa-eye");
        showButton.classList.add("fa-eye-slash");
        passwordTxt.type = "text";
    } else {
        showButton.classList.remove("fa-eye-slash");
        showButton.classList.add("fa-eye");
        passwordTxt.type = "password";
    }
}

async function Validate(){
    let usernameTextBox = document.getElementById("username");
    let passwordTextBox = document.getElementById("password");
    let usernameTooltip = document.getElementById("username-tooltip");
    let passwordTooltip = document.getElementById("password-tooltip");
    let registerResult = document.getElementById("register-result");

    let passwordValidated = ValidatePassword(passwordTextBox, passwordTooltip);
    ValidateUsername(usernameTextBox, usernameTooltip, passwordTextBox, registerResult, passwordValidated);
}

function ValidatePassword(passwordTextBox, passwordTooltip){
    let passwordDigitRegExp = /[0-9]/;
    let passwordSymbolRegExp = /[`!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

    if (!(passwordTextBox.value.length <= 20 && passwordTextBox.value.length >= 6)) {
        passwordTooltip.innerText = "Password length must be between 6 and 20";
        passwordTooltip.style.visibility = "visible";
        passwordTextBox.classList.remove("expecting-input");
        passwordTextBox.classList.add("wrong-input");
        return false;
    }
    if (!passwordDigitRegExp.test(passwordTextBox.value)) {
        passwordTooltip.innerText = "Password must contain at least one digit";
        passwordTooltip.style.visibility = "visible";
        passwordTextBox.classList.remove("expecting-input");
        passwordTextBox.classList.add("wrong-input");
        return false;
    }
    if (!passwordSymbolRegExp.test(passwordTextBox.value)) {
        passwordTooltip.innerText = "Password must contain at least one symbol";
        passwordTooltip.style.visibility = "visible";
        passwordTextBox.classList.remove("expecting-input");
        passwordTextBox.classList.add("wrong-input");
        return false;
    }
    passwordTooltip.style.visibility = "hidden";
    passwordTextBox.classList.remove("wrong-input");
    passwordTextBox.classList.add("expecting-input");
    return true;
}

async function ValidateUsername(usernameTextBox, usernameTooltip, passwordTextBox, registerResult, passwordValidated){
    let usernameRegExp = /^[a-zA-Z0-9_]+$/;

    if (!usernameRegExp.test(usernameTextBox.value)){
        usernameTooltip.innerText = "Username not valid";
        usernameTooltip.style.visibility = "visible";
        usernameTextBox.classList.remove("expecting-input");
        usernameTextBox.classList.add("wrong-input");
        USERNAME_CHECK = false;
        return;
    } else {
        usernameTooltip.style.visibility = "hidden";
    }

    await CheckUsernameAvailability(usernameTextBox, usernameTooltip, passwordTextBox, registerResult, passwordValidated);
}

async function CheckUsernameAvailability(usernameTextBox, usernameTooltip, passwordTextBox, registerResult, passwordValidated){
    let url = "http://lyricsguesser.net:8000/checkUsernameAvailability?username=" + usernameTextBox.value;
    let usernameAvailabilityRequest = new XMLHttpRequest();
    usernameAvailabilityRequest.open("GET", url, true);
    usernameAvailabilityRequest.timeout = 1000;
    usernameAvailabilityRequest.onload = () => {
        let respJson = JSON.parse(usernameAvailabilityRequest.responseText);
        if (respJson.status == 200) {
            USERNAME_CHECK_ERROR = false;
            USERNAME_CHECK = respJson.content;
            if (!USERNAME_CHECK) {
                usernameTooltip.innerText = "Username already used";
                usernameTooltip.style.visibility = "visible";
                usernameTextBox.classList.remove("expecting-input");
                usernameTextBox.classList.add("wrong-input");
                return;
            } else {
                usernameTooltip.style.visibility = "hidden";
                usernameTextBox.classList.remove("wrong-input");
                usernameTextBox.classList.add("expecting-input");
            }
            if (USERNAME_CHECK && passwordValidated) {
                RegisterUser(usernameTextBox.value, passwordTextBox.value, registerResult);
            }
        } else {
            window.location.href = "https://lyricsguesser.net/pages/error.html";
        }
    };
    usernameAvailabilityRequest.onerror = () => {
        USERNAME_CHECK_ERROR = true;
        USERNAME_CHECK = false;
        usernameTooltip.style.visibility = "hidden";
        usernameTextBox.classList.remove("wrong-input");
        usernameTextBox.classList.add("expecting-input");
        if (passwordValidated) {
            registerResult.innerHTML = "An error occured <i class='fa-solid fa-xmark'></i>";
            registerResult.style.color = "red";
            registerResult.style.opacity = "100%";
            ClearRegisterResultTimed(registerResult, 3000);
        } else {
            registerResult.style.opacity = "0";
        }
    };
    usernameAvailabilityRequest.ontimeout = () => {
        USERNAME_CHECK_ERROR = true;
        USERNAME_CHECK = false;
        usernameTooltip.style.visibility = "hidden";
        usernameTextBox.classList.remove("wrong-input");
        usernameTextBox.classList.add("expecting-input");
        if (passwordValidated) {
            registerResult.innerHTML = "Server not available <i class='fa-solid fa-xmark'></i>";
            registerResult.style.color = "red";
            registerResult.style.opacity = "100%";
            ClearRegisterResultTimed(registerResult, 3000);
        } else {
            registerResult.style.opacity = "0";
        }
    };
    usernameAvailabilityRequest.send();
}

async function RegisterUser(username, password, registerResult) {
    console.log(username);
    console.log(password);
    let registerRequest = new XMLHttpRequest();
    let url = "http://lyricsguesser.net:8000/register";
    let data = {"username":username,"password":password};
    registerRequest.open("PUT", url);
    registerRequest.setRequestHeader("Content-type", "application/json");
    registerRequest.timeout = 1500;
    registerRequest.onload = () => {
        let respJson = JSON.parse(registerRequest.responseText);
        if (respJson.status == 200) {
            registerResult.innerHTML = "Register successful <i class='fa-solid fa-check'></i>";
            registerResult.style.color = "lime";
            registerResult.style.opacity = "100%";
            ClearRegisterResultTimed(registerResult, 3000);
        } else {
            registerResult.innerHTML = "Register not successful <i class='fa-solid fa-xmark'></i>";
            registerResult.style.color = "red";
            registerResult.style.opacity = "100%";
            ClearRegisterResultTimed(registerResult, 3000);
        }
    };
    registerRequest.onerror = () => {
        registerResult.innerHTML = "An error occured <i class='fa-solid fa-xmark'></i>";
        registerResult.style.color = "red";
        registerResult.style.opacity = "100%";
        ClearRegisterResultTimed(registerResult, 3000);
    };
    registerRequest.ontimeout = () => {
        registerResult.innerHTML = "Server not available <i class='fa-solid fa-xmark'></i>";
        registerResult.style.color = "red";
        registerResult.style.opacity = "100%";
        ClearRegisterResultTimed(registerResult, 3000);
    };
    registerRequest.send(JSON.stringify(data));
}

function ClearRegisterResultTimed(registerResult, time) {
    setTimeout(() => {
        registerResult.style.opacity = "0";
    }, time);
}