function OnLoginLoad(){
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
    let loginResult = document.getElementById("login-result");

    let passwordValidated = ValidatePassword(passwordTextBox, passwordTooltip);
    ValidateUsername(usernameTextBox, usernameTooltip, passwordTextBox, loginResult, passwordValidated);
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

async function ValidateUsername(usernameTextBox, usernameTooltip, passwordTextBox, loginResult, passwordValidated){
    let usernameRegExp = /^[a-zA-Z0-9_]+$/;

    if (!usernameRegExp.test(usernameTextBox.value)){
        usernameTooltip.innerText = "Username not valid";
        usernameTooltip.style.visibility = "visible";
        usernameTextBox.classList.remove("expecting-input");
        usernameTextBox.classList.add("wrong-input");
        return;
    } else {
        usernameTooltip.style.visibility = "hidden";
        usernameTextBox.classList.remove("wrong-input");
        if (passwordValidated){
            Login(usernameTextBox, passwordTextBox, loginResult);
        }
    }
}

function Login(usernameTextBox, passwordTextBox, loginResult){
    let passwordLabel = document.getElementById("password-label");
    let showButton = document.getElementById("show-password");
    let username = usernameTextBox.value;
    let password = passwordTextBox.value;
    let loginReq = new XMLHttpRequest();
    loginReq.open("POST", "http://lyricsguesser.net:8000/login", true);
    loginReq.timeout = 1500;
    loginReq.setRequestHeader("Content-type", "application/json");
    let data = {"username":username,"password":password};
    loginReq.onload = () => {
        let respJson = JSON.parse(loginReq.responseText);
        if (respJson.status == 200) {
            localStorage.setItem("logtype", "lyricsguesser");
            localStorage.setItem("user", respJson.content.username);
            localStorage.setItem("hashcode", respJson.content.hashcode);
            loginResult.innerHTML = "Login successful <i class='fa-solid fa-check'></i>";
            loginResult.style.color = "lime";
            loginResult.style.opacity = "100%";
            ClearLoginResultTimed(loginResult, 3000);
            navload();
        } else {
            loginResult.innerHTML = "Username or password not correct <i class='fa-solid fa-xmark'></i>";
            loginResult.style.color = "red";
            loginResult.style.opacity = "100%";
            ClearLoginResultTimed(loginResult, 3000);
        }
        passwordTextBox.value = "";
        passwordLabel.classList.remove("label-shrink");
        showButton.style.visibility = "hidden";
    };
    loginReq.onerror = () => {
        passwordTextBox.value = "";
        passwordLabel.classList.remove("label-shrink");
        showButton.style.visibility = "hidden";
        loginResult.innerHTML = "An error occured <i class='fa-solid fa-xmark'></i>";
        loginResult.style.color = "red";
        loginResult.style.opacity = "100%";
        ClearLoginResultTimed(loginResult, 3000);
    };
    loginReq.ontimeout = () => {
        passwordTextBox.value = "";
        passwordLabel.classList.remove("label-shrink");
        showButton.style.visibility = "hidden";
        loginResult.innerHTML = "Server not available <i class='fa-solid fa-xmark'></i>";
        loginResult.style.color = "red";
        loginResult.style.opacity = "100%";
        ClearLoginResultTimed(loginResult, 3000);
    };
    loginReq.send(JSON.stringify(data));
}

function ClearLoginResultTimed(loginResult, time) {
    setTimeout(() => {
        loginResult.style.opacity = "0";
    }, time);
}