function RequestLyrics(reqBody){
    return new Promise(function (resolve, reject) {
        let lyricsReq = new XMLHttpRequest();
        lyricsReq.open("POST", "http://lyricsguesser.net:8000/getSongToGuess", true);
        lyricsReq.timeout = 1500;
        lyricsReq.setRequestHeader("Content-type", "application/json");
        lyricsReq.onload = () => {
            if (lyricsReq.status == 200) {
                resolve(JSON.parse(lyricsReq.response));
            } else {
                reject({
                    "status": lyricsReq.status,
                    "statusText": lyricsReq.statusText
                });
            }
        };
        lyricsReq.onerror = () => {
            reject({
                "status": lyricsReq.status,
                "statusText": lyricsReq.statusText
            });
        }
        lyricsReq.ontimeout = () => {
            reject({
                "status": 504,
                "statusText": "Gateway timeout"
            });
        }
        lyricsReq.send(JSON.stringify(reqBody));
    });
}

function SubmitGuessRequest(reqBody) {
    return new Promise(function (resolve, reject) {
        let submitReq = new XMLHttpRequest();
        submitReq.open("POST", "http://lyricsguesser.net:8000/submitGuess", true);
        submitReq.timeout = 1500;
        submitReq.setRequestHeader("Content-type", "application/json");
        submitReq.onload = () => {
            if (submitReq.status == 200) {
                resolve(JSON.parse(submitReq.response));
            } else {
                reject({
                    "status": submitReq.status,
                    "statusText": submitReq.statusText
                });
            }
        };
        submitReq.onerror = () => {
            reject({
                "status": submitReq.status,
                "statusText": submitReq.statusText
            });
        }
        submitReq.ontimeout = () => {
            reject({
                "status": 504,
                "statusText": "Gateway timeout"
            });
        }
        submitReq.send(JSON.stringify(reqBody));
    });
}

async function GetLyricsData(){
    let params = new URLSearchParams(window.location.search);

    let logType = localStorage.getItem("logtype");
    let hashcode = localStorage.getItem("hashcode");
    let gameMode = params.get("gamemode");
    let user = localStorage.getItem("user");

    if (logType === undefined || hashcode === undefined || gameMode === undefined || gameMode === null || user === undefined){
        return {"status": 400, "statusText": "Bad request"};
    }
    let reqBody = {
        "logtype": logType,
        "hashcode": hashcode,
        "gamemode": gameMode,
        "user": user
    };
    let lyricsResp = null;
    try {
        lyricsResp = await RequestLyrics(reqBody);
    } catch (error) {
        lyricsResp = error;
    }
    if (lyricsResp === null) return {"status": 500, "statusText": "Internal server error"};

    if (lyricsResp.status == 404) {
        return await GetLyricsData();
    }
    return lyricsResp;
}

async function GetSubmitGuessResponse() {
    let logType = localStorage.getItem("logtype");
    let hashcode = localStorage.getItem("hashcode");
    let user = localStorage.getItem("user");
    let guess = document.getElementById("guess-txt").value;

    if (logType === undefined || hashcode === undefined || guess === undefined || user === undefined || guess === null){
        return {"status": 400, "statusText": "Bad request"};
    }

    let reqBody = {
        "logtype": logType,
        "hashcode": hashcode,
        "user": user,
        "guess": guess
    }

    let guessResp = null;

    try {
        guessResp = await SubmitGuessRequest(reqBody);
    } catch (error) {
        guessResp = error;
    }
    if (guessResp === null) return {"status": 500, "statusText": "Internal server error"};

    return guessResp;
}

async function UpdateLyricsContainer() {
    let lyricsBox = document.getElementById("lyrics-box");
    let copyrightBox = document.getElementById("copyright-box");

    let newLyricsData = await GetLyricsData();
    if (newLyricsData.status != 200) {
        lyricsBox.innerHTML = "<p>" + newLyricsData.status + "</p><p>" + newLyricsData.statusText + "</p>";
        copyrightBox.innerHTML = "Something went wrong";
        return;
    }
    lyricsBox.innerHTML = GetLyricsHTML(newLyricsData.content.lyrics);
    copyrightBox.innerHTML = newLyricsData.content.lyrics_copyright;

    let tracking = document.createElement("img");
    tracking.setAttribute("src", newLyricsData.content.pixel_tracking_url);
    copyrightBox.appendChild(tracking);
}

function GetLyricsHTML(lyricsString) {
    let split = lyricsString.split('\n');
    let sumString = "";

    for (i = 0; i < split.length; i++) {
        sumString += "<p>";
        sumString += split[i];
        sumString += "</p>\n";
    }
    return sumString;
}

async function SkipSong() {
    await UpdateLyricsContainer();
}

async function Next(){
    window.location.reload();
}

async function SubmitGuess(){

    let guessResp = await GetSubmitGuessResponse();
    console.log(guessResp);
    if (guessResp.status != 200) {
        //window.location = "http://lyricsguesser.net/pages/error.html";
        return;
    }

    let guessData = guessResp.content;

    // data insert into popup
    let popupTitle = document.getElementById("popup-title");
    let popupScore = document.getElementById("popup-score");
    let popupProgress = document.getElementById("popup-progress-bar");
    let popupSolution = document.getElementById("popup-solution");
    let popupTotal = document.getElementById("popup-total");

    popupScore.innerText = guessData.points + "/100";
    popupProgress.value = guessData.points;

    if (guessData.points >= 80){
        popupTitle.innerText = "BRAVO!";
    } else if (guessData.points >= 50) {
        popupTitle.innerText = "CLOSE!";
    } else if (guessData.points >=20) {
        popupTitle.innerText = "NOT QUITE!";
    } else {
        popupTitle.innerText = "TRY AGAIN!";
    }

    popupSolution.innerText = guessData.title + " by " + guessData.artist;
    popupTotal.innerText = guessData.totalpoints;

    // popup show
    let popup = document.getElementById("guess-popup");
    let overlay = document.getElementById("guess-overlay");

    popup.classList.add("guess-open-popup");
    overlay.classList.add("guess-visible-overlay");
}

async function OnGameLoad() {
    await UpdateLyricsContainer();
    navload();
}