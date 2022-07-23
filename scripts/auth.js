const CLIENT_ID = "5e87bce380b34915a11ae22e9d03c519";
const REDIRECT_URI = "http://lyricsguesser.net/pages/authredirect.html";
const SCOPES = "playlist-read-private user-read-private user-library-read";
const AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
const ERROR_PAGE = "http://lyricsguesser.net/pages/error.html";

function GetLogInURI(){
    let url = AUTHORIZE_ENDPOINT;
    url += "?client_id=" + CLIENT_ID;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(REDIRECT_URI);
    url += "&show_dialog=true";
    url += "&scope=" + SCOPES;
    url += "&state=app_auth";
    return url;
}

/**
 * Effects: returns the code query parameter if state is "app_auth" and there is no error parameter.
 *          Redirects to ERROR_PAGE otherwise. 
 */
function FetchCode(){
    let params = new URLSearchParams(window.location.search);
    if(params.get("state") != "app_auth" || params.get("error") != null){
        localStorage.setItem("errorCode", "400");
        localStorage.setItem("errorStatus", "Bad Request");
        window.location.href = ERROR_PAGE;
    } else {
        return params.get("code");
    }
}

/**
 * Effects: sends a POST request to the TOKEN_ENDPOINT in order to get the Accesstoken.
 *          Then proceeds to handle the response.
 */
function RequestUserAccessToken(code){
    let requests = new XMLHttpRequest();

    let uri = "http://lyricsguesser.net:8000/requestSpotifyUserAccessToken?code=" + code + "&redirect_uri=" + encodeURI(REDIRECT_URI);

    requests.open("GET", uri, true);
    requests.onload = () => {
        
        if (requests.status == 200) {
            let response = JSON.parse(requests.responseText);
            if (response.status != 200) {
                localStorage.setItem("errorCode", response.status);
                localStorage.setItem("errorStatus", response.statusText);
                window.location.href = ERROR_PAGE;
            }
            else {
                localStorage.setItem("logtype", "spotify");
                localStorage.setItem("user", response.content.user);
                localStorage.setItem("name", response.content.name);
                localStorage.setItem("country", response.content.country);
                localStorage.setItem("hashcode", response.content.hashcode);
                window.location.href = "http://lyricsguesser.net";
            }
        } else {
            localStorage.setItem("errorCode", requests.status);
            localStorage.setItem("errorStatus", requests.statusText);
            window.location.href = ERROR_PAGE;
        }
        return;
    }
    requests.send();
}

/**
 * Effects: starts the access_token fetch routine
 */
function OnRedirectLoad(){
    let code = FetchCode();
    if (code === null || code === undefined) {
        window.location.href = ERROR_PAGE;
    } else {
        RequestUserAccessToken(code);
    }
}