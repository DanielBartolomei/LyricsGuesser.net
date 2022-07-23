function errorload(){
    let errorTitle = document.getElementById("errorTitle");
    let errorContent = document.getElementById("errorContent");
    let errorDescContainer = document.getElementById("errorDesc");
    let code = localStorage.getItem("errorCode");
    let errorDesc;
    errorTitle.innerText = code + " - " + localStorage.getItem("errorStatus");
    switch (code) {
        case "400":
            errorDesc = "Maybe some data provided is no longer valid";
            break;
        case "401":
            errorDesc = "You are not authorized to access this resource";
            break;
        case "403":
            errorDesc = "If you tried to login with Spotify, you're not whitelisted";
            break;
        case "404":
            errorDesc = "The requested resource was not found";
            break;
        case "409":
            errorDesc = "Either yours or server's informations are not updated";
            break;
        case "500":
            errorDesc = "An error occured within the backend server";
        case "504":
            errorDesc = "Connection timeout with backend server, try refresh the page";
        default:
            errorDesc = "Something went wrong";
            break;
    }
    errorDescContainer.innerText = errorDesc;
    errorContent.style.visibility = "visible";
}