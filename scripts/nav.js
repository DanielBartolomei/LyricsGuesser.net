/**
 * Nav handling scripts file
 */

function OpenNav(){
    document.getElementById("hiddenNav").style.width = "100%";
}

function CloseNav(){
    document.getElementById("hiddenNav").style.width = "0";
}

function navload(){
    let logType = localStorage.getItem("logtype");
    let trigger = document.getElementById("trigger");
    let triggerMobile = document.getElementById("trigger-mobile");

    if (logType === undefined || logType === null){
        trigger.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> <span class="link-label">Login</span>';
        trigger.href = "http://lyricsguesser.net/pages/login.html";
    } else {
        trigger.innerHTML = '<i class="fa-regular fa-circle-user"></i> <span id="nav-user" class="link-label">User</span>';
        trigger.href="#";
        trigger.onclick = () => {
            let ddw = document.getElementById("dropdown");
            ddw.classList.toggle("user-dropdown-open");
        }
        ddwUser = document.getElementById("dropdown-username");
        if (logType == "lyricsguesser"){
            ddwUser.innerText = "Logged in as " + localStorage.getItem("user");
        } else {
            ddwUser.innerText = "Logged in as " + localStorage.getItem("name");
        }
        
    }

    if (logType === undefined || logType === null){
        triggerMobile.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>';
        triggerMobile.href = "http://lyricsguesser.net/pages/login.html";
    } else {
        triggerMobile.innerHTML = '<i class="fa-regular fa-circle-user"></i>';
        triggerMobile.href="#";
        triggerMobile.onclick = () => {
            let ddw = document.getElementById("dropdown");
            ddw.classList.toggle("user-dropdown-open");
        }
        ddwUser = document.getElementById("dropdown-username");
        if (logType == "lyricsguesser"){
            ddwUser.innerText = "Logged in as " + localStorage.getItem("user");
        } else {
            ddwUser.innerText = "Logged in as " + localStorage.getItem("name");
        }
        
    }
}

function logout(){
    let ddw = document.getElementById("dropdown");
    if (ddw.classList.contains("vis")) {
        ddw.classList.remove("vis");
    }
    localStorage.removeItem("logtype");
    localStorage.removeItem("user");
    localStorage.removeItem("name");
    localStorage.removeItem("country");
    localStorage.removeItem("hashcode");

    window.location.reload();
}