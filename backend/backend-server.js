// ATTRIBUTES
const PORT = 8000;
var APP_ACCESS_TOKEN;

// SPOTIFY ENDPOINTS AND PLAYLIST IDs
const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_SEARCH_ENDPOINT = "/search";
const SPOTIFY_PLAYLIST_ENDPOINT = "/playlists";

// Playlist throwback
const ALL_OUT_2010 = "37i9dQZF1DX5Ejj0EkURtP";
const ALL_OUT_2000 = "37i9dQZF1DX4o1oenSJRJd";
const ALL_OUT_90 = "37i9dQZF1DXbTxeAdrVG2l";
const ALL_OUT_80 = "37i9dQZF1DX4UtSsGT1Sbe";
const ALL_OUT_70 = "37i9dQZF1DWTJ7xPn4vNaz";
const ALL_OUT_60 = "37i9dQZF1DXaKIA8E7WcJj";
const ALL_OUT_50 = "37i9dQZF1DWSV3Tk4GO2fq";

// Playlist TOP
const TOP_50_GLOBAL = "37i9dQZEVXbMDoHDwVN2tF";
const TODAY_TOP = "37i9dQZF1DXcBWIGoYBM5M";
const INTER_HITS = "37i9dQZF1DX6mWRaog94SQ";

// Playlist by genre
const ROCK_CLASSIC = "37i9dQZF1DWXRqgorJj26U";
const LATINO = "37i9dQZF1DX10zKzsJ2jva";
const COUNTRY = "37i9dQZF1DX1lVhptIYRda";
const ROCK = "37i9dQZF1DXcF6B6QPhFDv";
const RAP = "37i9dQZF1DX0XUsuxWHRQd";
const DANCE = "37i9dQZF1DX0BcQWzuB7ZO";

// MUSIXMATCH ENDPOINTS
const MUSIXMATCH_ENDPOINT = "https://api.musixmatch.com/ws/1.1";
const MATCHER_ENDPOINT = "/matcher.lyrics.get";

// IMPORTS
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const bodyParser = require("body-parser");
const stringSimilarity = require("string-similarity");
const { json } = require("body-parser");
const path = require("path");

// MISC FUNCTIONS
function validateOrigin(req){
    return (req.hostname == "localhost" || req.hostname == "127.0.0.1" || req.hostname == "lyricsguesser.net" || req.hostname == "93.66.23.222")
}

function makeErrorResponseNotFound() {
    let err_resp = {
        "status": 404,
        "statusText": "Not Found",
        "headers": {
            "Content-type": "application/json"
        }
    }
    return err_resp;
}

function makeErrorResponseForbidden() {
    let err_resp = {
        "status": 403,
        "statusText": "Forbidden",
        "headers": {
            "Content-type": "application/json"
        }
    }
    return err_resp;
}

function makeErrorResponseBadRequest() {
    let err_resp = {
        "status": 400,
        "statusText": "Bad Request",
        "headers": {
            "Content-type": "application/json"
        }
    }
    return err_resp;
}

function makeErrorResponseUnauthorized() {
    let err_resp = {
        "status": 401,
        "statusText": "Unauthorized",
        "headers": {
            "Content-type": "application/json"
        }
    }
    return err_resp;
}

function makeErrorResponseConflict() {
    let err_resp = {
        "status": 409,
        "statusText": "Conflict",
        "headers": {
            "Content-type": "application/json"
        }
    }
    return err_resp;
}

function makeOKResponse(content) {
    let resp;
    if (content != null && content != undefined) {
        resp = {
            "status": 200,
            "statusText": "OK",
            "headers": {
                "Content-type": "application/json"
            },
            "content": content
        }
    } else {
        resp = {
            "status": 200,
            "statusText": "OK",
            "headers": {
                "Content-type": "application/json"
            }
        }
    }
    return resp;
}

/**
 * Deletes all content between () and after a - of a songf title.
 * Example:     Hola (I Say) - ft. Tom Walker --> Hola
 *              1, 2, 3 (feat. Jason Derulo) --> 1, 2, 3
 * 
 * These are most common titles format on Spotify
 */
function ReformatSongTitle(songTitle){
    let ret = songTitle.replace(/ \([\s\S]*?\)/g, "").trim();
    if (ret.indexOf('-') != -1) {
        ret = ret.substring(0, ret.indexOf('-')).trim();
    }
    return ret;
}

function CalculateGuessPoints(songTitle, guess){
    let comparableTitle = ReformatSongTitle(songTitle).toLowerCase();
    let comparableGuess = guess.toLowerCase();
    let points = 100*stringSimilarity.compareTwoStrings(comparableTitle, comparableGuess) - 35;
    if (points < 0) points = 0;
    points = points / 65 * 100;
    return Math.round(points);
}

async function fetchAppAccessToken(){
    let encrypted = Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET);
    let options = {
        url: SPOTIFY_TOKEN_ENDPOINT,
        method: "POST",
        data: "grant_type=client_credentials",
        headers: {
            "Authorization": "Basic " + encrypted.toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    try {
        const resp = await axios.request(options);
        return resp.data.access_token;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

async function InitAppAccessToken() {
    APP_ACCESS_TOKEN = await fetchAppAccessToken();
}

function SaveUserInfo(jsonresp, res){
    let options = {
        url: SPOTIFY_API + "/me",
        method: "GET",
        headers: {
            "Authorization": "Bearer " + jsonresp.access_token
        }
    }
    axios.request(options)
    .then((response) => {
        if (response.data.error != undefined) return;

        let dirPath = "./users/usertokens/" + response.data.id;

        if(!fs.existsSync(dirPath)){
            fs.mkdirSync(dirPath);
        }

        let toHash = response.data.id + ':' + response.data.display_name;
        let hashCodeSHA256Hasher = crypto.createHmac("sha256", process.env.SALT);
        let hashCode = hashCodeSHA256Hasher.update(toHash).digest("base64");

        reserved = {
            "access_token": jsonresp.access_token,
            "refresh_token": jsonresp.refresh_token,
        }

        info = {
            "user": response.data.id,
            "name": response.data.display_name,
            "country": response.data.country,
            "hashcode": hashCode,
        }

        fs.writeFileSync(dirPath + "/tokens.json", JSON.stringify(reserved));
        fs.writeFileSync(dirPath + "/info.json", JSON.stringify(info));

        if (!fs.existsSync(dirPath + "/score.json")) {
            let score = {
                "score": 0
            }
            fs.writeFileSync(dirPath + "/score.json", JSON.stringify(score));
        }

        res.json(makeOKResponse(info));
    })
    .catch((error) => {
        console.log(error.response);
        res.json(error.response);
    });
}

async function RefreshUserTokenFromId(userid) {
    if (userid === null || userid === undefined) {
        return null;
    }

    data = JSON.parse(fs.readFileSync("./users/usertokens/" + userid + "/tokens.json", "utf-8"));

    if (data === null || data === undefined) {
        return null;
    }
    
    token = data.refresh_token;

    if (token === null || token === undefined) {
        return null;
    }

    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + token;
    let cid = process.env.SPOTIFY_CLIENT_ID;
    let csec = process.env.SPOTIFY_CLIENT_SECRET;
    let auth = Buffer.from(cid + ':' + csec);
    let options = {
        url: SPOTIFY_TOKEN_ENDPOINT,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + auth.toString("base64")
        },
        data: body,
        responseType: "json"
    };
    let resp;
    try {
        resp = await axios.request(options);
    }
    catch (error) {
        console.log(error);
        resp = error.response;
    }
    return resp.data;
}

async function RefreshUserToken(refreshToken, userid) {
    if (refreshToken === null) return;

    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refreshToken;
    let cid = process.env.SPOTIFY_CLIENT_ID;
    let csec = process.env.SPOTIFY_CLIENT_SECRET;
    let auth = Buffer.from(cid + ':' + csec);
    let options = {
        url: SPOTIFY_TOKEN_ENDPOINT,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + auth.toString("base64")
        },
        data: body,
        responseType: "json"
    };
    let resp;
    try {
        resp = await axios.request(options);
    }
    catch (error) {
        console.log(error);
        resp = error.response;
    }
    if (resp.status == 200) {
        let reserved = {
            "access_token": resp.data.access_token,
            "refresh_token": refreshToken,
        }
        fs.writeFileSync("./users/usertokens/" + userid + "/tokens.json", JSON.stringify(reserved));
    } 
    return resp;
}

function CheckUsernameAvailability(username) {
    usernamesFileContent = JSON.parse(fs.readFileSync("./users/usernames/usernames.json", "utf-8"));
    let usernames = usernamesFileContent.usernames;
    return !usernames.includes(username);
}

function AddUsername(username) {
    if (username === null || username === "" || username === undefined){
        return;
    }
    if (CheckUsernameAvailability(username)) {
        let usernames = (JSON.parse(fs.readFileSync("./users/usernames/usernames.json", "utf-8"))).usernames;
        usernames.push(username);
        let fileData = {
            "usernames": usernames
        }
        fs.writeFileSync("./users/usernames/usernames.json", JSON.stringify(fileData));
    }
}

function RegisterUser(username, password) {
    AddUsername(username);

    let toHash = username + ":" + password;
    let hashCodeSHA256Hasher = crypto.createHmac("sha256", process.env.SALT);
    let hashCode = hashCodeSHA256Hasher.update(toHash).digest("base64");

    let passwordSHA256Hasher = crypto.createHmac("sha256", process.env.SALT);
    let hashedPassword = passwordSHA256Hasher.update(password).digest("base64");

    let returnData = {
        "username": username,
        "hashcode": hashCode
    }
    let userData = {
        "username": username,
        "hashedPassword": hashedPassword,
        "hashCode": hashCode
    }
    let score = {
        "score": 0
    }

    if (!fs.existsSync("./users/usernames/" + username)) {
        fs.mkdirSync("./users/usernames/" + username);
    }
    fs.writeFileSync("./users/usernames/" + username + "/info.json", JSON.stringify(userData));
    fs.writeFileSync("./users/usernames/" + username + "/score.json", JSON.stringify(score));

    return returnData;
}

async function RequestSongLyrics(songTitle, artist) {
    if (songTitle === null || artist === null) return null;
    let url_temp = MUSIXMATCH_ENDPOINT + MATCHER_ENDPOINT + "?apikey=" + process.env.MUSIXMATCH_API_KEY 
    url_temp += "&q_track=" + encodeURI(songTitle) + "&q_artist=" + encodeURI(artist);
    let options = {
        url: url_temp,
        method: "GET"
    };
    let resp;
    try {
        resp = await axios.request(options);
    } catch (error) {
        if (error.response.status == 402) {
            console.log("Musixmatch API limit reached");
        }
        resp = error.response;
    }
    return resp;
}

function GetUserTokensFromId(userid) {
    if (userid === null || userid == "") return null;
    let filePath = "./users/usertokens/" + userid + "/tokens.json";
    if (!fs.existsSync(filePath)) return null;

    tokensObj = JSON.parse(fs.readFileSync(filePath));
    return tokensObj;
}

function GetRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max-min) + min);
    // max excluded, min included
}

// PUBLIC PLAYLISTS FUNCTIONS

async function RequestPublicSpotifyPlaylistTracks(playlistid, limit = 1, offset = 0) {
    if (playlistid === null || playlistid === undefined) return null;
    if (offset < 0 || offset === null) offset = 0;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;
    let options = {
        url: SPOTIFY_API + SPOTIFY_PLAYLIST_ENDPOINT + '/' + encodeURI(playlistid) + "/tracks?limit=" + limit + "&offset=" + offset,
        method: "GET",
        headers: {
            "Authorization": "Bearer " +  APP_ACCESS_TOKEN
        }
    }
    let resp;
    try {
        resp = await axios.request(options);
    }
    catch (error) {
        if (error.response.status == 401) {
            console.log("Need to refresh App AccessToken");
            APP_ACCESS_TOKEN = await fetchAppAccessToken();
            resp = await RequestPublicSpotifyPlaylistTracks(playlistid);
        } else if (error.response.status == 429) {
            console.log("Spotify API limit reached");
            resp = error.response;
        } else {
            resp = error.response;
        }
    }
    return resp;
}

async function GetPublicSpotifyPlaylistTotalTracks(playlistid) {
    if (playlistid === null || playlistid === undefined) return null;

    let playlistTracks = await RequestPublicSpotifyPlaylistTracks(playlistid, 1, 0);
    if (playlistTracks === null || playlistTracks.status != 200) return null;

    return playlistTracks.data.total;
}

async function SelectPublicSpotifyPlaylistTrack(playlistid) {
    if (playlistid === null || playlistid === undefined) return null;

    let playlistTracksNum = await GetPublicSpotifyPlaylistTotalTracks(playlistid);


    let playlist = await RequestPublicSpotifyPlaylistTracks(playlistid, 1, GetRandomInt(0, playlistTracksNum));
    if (playlist === null) return null;
    if (playlist.status != 200) return null;

    let track = playlist.data.items[0].track;
    let title = track.name;
    let artist = track.artists[0].name;
    let trackData = {
        "title": title,
        "artist": artist
    }
    return trackData;
}

// USER PLAYLISTS FUNCTIONS

async function GetUserPlaylists(userid, limit = 1, offset = 0) {
    if (userid === null) return null;

    let userTokens = GetUserTokensFromId(userid);
    if (userTokens === null) return null;

    if (offset < 0 || offset === null) offset = 0;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;

    let options = {
        url: SPOTIFY_API + "/me/playlists?limit=" + limit + "&offset=" + offset,
        method: "GET",
        headers: {
            "Authorization": "Bearer " +  userTokens.access_token
        }
    }
    let resp;
    try {
        resp = await axios.request(options);
    }
    catch (error) {
        if (error.response.status == 401) {
            console.log("Need to refresh usertoken")
            await RefreshUserToken(userTokens.refresh_token, userid);
            resp = await GetUserPlaylists(userid, limit, offset);
        } else if (error.response.status == 429) {
            resp = error.response;
            console.log("Spotify API limit reached");
        } else {
            resp = error.response;
        }
    }
    return resp;
}

function SelectPlaylist(playlists) {
    if (playlists === null || playlists === undefined) return null;

    let playlist = playlists[GetRandomInt(0, playlists.length)];
    
    return playlist;
}

async function GetUserPlaylistTracks(userid, playlistid, limit = 1, offset = 0) {
    if (playlistid === null || playlistid === undefined) return null;

    let userTokens = GetUserTokensFromId(userid);
    if (userTokens === null) return null;

    if (offset < 0 || offset === null) offset = 0;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;

    let options = {
        url: SPOTIFY_API + "/playlists/" + playlistid + "/tracks?limit=" + limit + "&offset=" + offset,
        method: "GET",
        headers: {
            "Authorization": "Bearer " +  userTokens.access_token
        }
    }
    let resp;
    try {
        resp = await axios.request(options);
    }
    catch (error) {
        if (error.response.status == 401) {
            console.log("Need to refresh usertoken");
            await RefreshUserToken(userTokens.refresh_token, userid);
            resp = await GetUserPlaylistTracks(userid, playlistid, limit, offset);
        } else if (error.response.status == 429){
            resp = error.response;
            console.log("Spotify API limit reached");
        } else {
            resp = error.response;
        }
    }
    return resp;
}

async function GetPlaylistTracksNumber(userid, playlistid) {
    if (playlistid === null) return null;

    let resp = await GetUserPlaylistTracks(userid, playlistid, 1, 0);
    if (resp.status != 200) {
        return null;
    }
    return resp.data.total;
}

async function SelectTrackFromUserPlaylists(userid) {
    if (userid === null) return null;

    let playlistsResp = await GetUserPlaylists(userid, 50, 0);
    if (playlistsResp === null || playlistsResp.status != 200) return null;

    let playlist = SelectPlaylist(playlistsResp.data.items);
    let playlistLen = await GetPlaylistTracksNumber(userid, playlist.id);
    
    let trackNum = GetRandomInt(0, playlistLen);
    let track = await GetUserPlaylistTracks(userid, playlist.id, 1, trackNum);

    let trackObj = {
        "title": track.data.items[0].track.name,
        "artist": track.data.items[0].track.artists[0].name
    }
    return trackObj;
}

// USER SAVED TRACKS FUNCTIONS

async function GetUserSavedTracks(userid, limit = 1, offset = 0) {
    if (userid === null) return null;

    let userTokens = GetUserTokensFromId(userid);
    if (userTokens === null) return null;

    if (offset < 0 || offset === null) offset = 0;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;

    let options = {
        url: SPOTIFY_API + "/me/tracks?limit=" + limit + "&offset=" + offset,
        method: "GET",
        headers: {
            "Authorization": "Bearer " +  userTokens.access_token
        }
    }
    let resp;
    try {
        resp = await axios.request(options);
    }
    catch (error) {
        if (error.response.status == 401) {
            console.log("Need to refresh usertoken");
            await RefreshUserToken(userTokens.refresh_token, userid);
            resp = await GetUserSavedTracks(userid, limit, offset);
        } else if (error.response.status == 429){
            resp = error.response;
            console.log("Spotify API limit reached")
        } else {
            resp = error.response;
        }
    }
    return resp;
}

async function GetUserSavedTracksNumber(userid) {
    if (userid === null) return null;

    let resp = await GetUserSavedTracks(userid, 1, 0);
    if (resp.status != 200) {
        return null;
    }
    return resp.data.total;
}

async function SelectUserTrack(userid) {
    if (userid === null) return null;

    let total = await GetUserSavedTracksNumber(userid);
    if (total === null) return null;

    let songNum = GetRandomInt(0, total);

    let resp = await GetUserSavedTracks(userid, 1, songNum);
    if (resp === null || resp.status != 200) return null;

    let song = resp.data.items[0].track;
    let title = song.name;
    let artist = song.artists[0].name;

    let songObj = {
        "title": title,
        "artist": artist
    }
    return songObj;
}

function SaveSongData(songObj, savePath) {
    if (songObj === null || savePath === null) return false;

    fs.writeFileSync(savePath, JSON.stringify(songObj));
    return true;
}

// APP CONFIG
const app = express();
app.use(cors({
    origin: ["http://lyricsguesser.net", "http://www.lyricsguesser.net", "http://localhost"],
    methods: ["GET", "POST", "PUT"]
}));
app.use(bodyParser.json());

// EXPRESS ENDPOINTS
app.get('/', (req, res) => {
    console.log("Received a request by: " + req.hostname);
    if (validateOrigin(req)){
        console.log("Origin validated")
        res.json(makeOKResponse("This is the backend server!"));
    }else {
        console.log("Origin not validated");
        res.json(makeErrorResponseForbidden());
    }
});

/**
 * On request, return the JSON response containing the accesstoken and refreshtoken for the corresponding coded user.
 * The request must be made using url query parameters such as:
 *    http://lyricsguesser.net:8000/requestSpotifyUserAccessToken?code=CODE&redirect_uri=URI
 */
 app.get("/requestSpotifyUserAccessToken", (req, res) => {

    console.log("Recieved a SpotifyUserAccessToken request by: " + req.hostname);

    if (validateOrigin(req)){
        console.log("Request origin validated");

        let code = req.query.code || null;
        let redirect_uri = req.query.redirect_uri || null;
        
        if (code === null || redirect_uri === null) {
            res.json(makeErrorResponseBadRequest());
        } else {
            let body = "grant_type=authorization_code";
            body += "&code=" + code;
            body += "&redirect_uri=" + encodeURI(redirect_uri);
            let cid = process.env.SPOTIFY_CLIENT_ID;
            let csec = process.env.SPOTIFY_CLIENT_SECRET;
            let auth = Buffer.from(cid + ':' + csec);
            let options = {
                url: SPOTIFY_TOKEN_ENDPOINT,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + auth.toString("base64")
                },
                data: body,
                responseType: "json"
            };
            axios.request(options)
            .then(function (response_token){
                let jsonresp = response_token.data;
                if (jsonresp.access_token != undefined) {
                    SaveUserInfo(jsonresp, res);
                } else {
                    res.json(makeErrorResponseBadRequest());
                }
            })
            .catch(function (error){
                console.log(error);
            });
        }
    } else {
        console.log("Origin not validated");
        res.json(makeErrorResponseForbidden());
    }
});

/**
 * On request, return the JSON response containing the data of the Spotify User who's id is userid.
 * The request must be made using url query parameters such as:
 *    http://lyricsguesser.net:8000/usertokens/user_id (where user_id is a Spotify user ID)
 */
app.get("/usertokens/:userid", (req, res) => {

    console.log("Received a user info get from origin " + req.hostname);

    if (validateOrigin(req)){
        console.log("Origin validated");

        if (fs.existsSync("./users/usertokens/" + req.params.userid)){

            let userInfo = JSON.parse(fs.readFileSync("./users/usertokens/" + req.params.userid + "/info.json", "utf-8"));
            res.json(makeOKResponse(userInfo));

        } else {
            res.json(makeErrorResponseNotFound());
        }

    } else {
        console.log("Origin not validated");
        res.json(makeErrorResponseForbidden());
    }
});

/**
 * On request, return the JSON response containing true if the username is available, false otherwise.
 * The request must be made using url query parameters such as:
 *    http://lyricsguesser.net:8000/checkUsernameAvailability?username=USERNAME (where username is a LyricsGuesser username)
 */
app.get("/checkUsernameAvailability", (req, res) => {

    console.log("Received a username availability get from origin " + req.hostname);

    if (validateOrigin(req)){
        console.log("Origin validated");

        username = req.query.username || undefined;

        if (username === undefined) {
            res.json(makeErrorResponseBadRequest());
        } else {
            let check = CheckUsernameAvailability(username);
            console.log("Username " + username + " is " + check + " available");
            res.json(makeOKResponse(check));
        }

    } else {
        console.log("Origin not validated");
        res.json(makeErrorResponseForbidden());
    }

});

/**
 * On request, return the JSON response containing username and hashCode of the new user.
 * The request must be made using body data.
 * 
 * Body arguments:
 *  username    (lyricsguesser username)    required
 *  password    (lyricsguesser password)    required
 * 
 * JSON response:
 *  username    the posted username by the request
 *  hashcode    server generated code
 */
app.put("/register", (req, res) => {
    console.log("Received a register request from origin " + req.hostname);

    if (validateOrigin(req)){

        let password = req.body.password || undefined;
        let username = req.body.username || undefined;

        if (username === undefined || password === undefined) {
            res.json(makeErrorResponseBadRequest());
        } else {
            let check = CheckUsernameAvailability(username);
            if (!check) {
                res.json(makeErrorResponseConflict());
            } else {
                registerData = RegisterUser(username, password);
                console.log("Registered user: " + username);
                res.json(makeOKResponse(registerData));
            }
        }

    } else {
        console.log("Origin not validated");
        res.json(makeErrorResponseForbidden());
    }
});

/**
 * On request, return the JSON response containing username and hashCode of the logged user.
 * The request must be made using body data.
 * 
 * Body arguments:
 *  username    (lyricsguesser username)    required
 *  password    (lyricsguesser password)    required
 * 
 * JSON response:
 *  username    the posted username by the request
 *  hashcode    server generated code
 */
app.post("/login", (req, res) => {
    console.log("Received a login request from origin " + req.hostname);

    if (validateOrigin(req)) {
        let password = req.body.password || undefined;
        let username = req.body.username || undefined;

        if (username === undefined || password === undefined) {
            res.json(makeErrorResponseBadRequest());
        } else {
            if (!fs.existsSync("./users/usernames/" + username)) {
                res.json(makeErrorResponseUnauthorized());
            } else {
                const userData = JSON.parse(fs.readFileSync("./users/usernames/" + username + "/info.json"));

                let hashedPass = userData.hashedPassword;

                let passwordSHA256Hasher = crypto.createHmac("sha256", process.env.SALT);
                let hashedPassword = passwordSHA256Hasher.update(password).digest("base64");

                if (hashedPass == hashedPassword) {
                    let responseData = {
                        "username": userData.username,
                        "hashcode": userData.hashCode
                    }
                    res.json(makeOKResponse(responseData));
                } else {
                    res.json(makeErrorResponseUnauthorized());
                }
            }
        }
    } else {
        console.log("Origin not validated");
        res.json(makeErrorResponseForbidden());
    }
});

/**
 * On request, return the JSON response containing song lyrics of the song selected by the server.
 * The request must be made using body data.
 * 
 * Body arguments:
 *  gamemode    (a possible game mode)      required
 *  logtype     (spotify or lyricsguesser)  required
 *  hashcode    (server generated code)     required
 *  user        (spotify/lyricsguesser id)  required
 * 
 * JSON response:
 *  lyrics                  actual song lyrics body
 *  script_tracking_url     musixmatch tracking script url (must be included in the page)
 *  lyrics_copyright        copyright string (must be included in the page)
 */
app.post("/getSongToGuess", async (req, res) => {
    if(!validateOrigin(req)){
        res.json(makeErrorResponseForbidden());
        return;
    }

    let gameMode = req.body.gamemode || undefined;
    let logType = req.body.logtype || undefined;
    let user = req.body.user || undefined;
    let hashcode = req.body.hashcode || undefined;

    if (logType != "spotify" && logType != "lyricsguesser") {
        res.json(makeErrorResponseUnauthorized());
        return;
    }

    if ((user === null || user === undefined) || (hashcode === null || hashcode === undefined)) {
        res.json(makeErrorResponseBadRequest());
        return;
    }

    let trackData = null;
    let notSpotifyGameMode;

    if (logType == "spotify") {
        // spotify user
        notSpotifyGameMode = false;

        if (!fs.existsSync("./users/usertokens/" + user)) {
            console.log("User does not exist");
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        let userData = JSON.parse(fs.readFileSync("./users/usertokens/" + user + "/info.json"));
        if (userData.hashcode != hashcode) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        switch (gameMode) {
            case "favorites":
                trackData = await SelectUserTrack(user);
                break;
            case "playlists":
                trackData = await SelectTrackFromUserPlaylists(user);
                break;
            default:
                notSpotifyGameMode = true;
        }
    } else {
        // lyricsguesser user
        notSpotifyGameMode = true;

        if (!fs.existsSync("./users/usernames/" + user)) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        let userData = JSON.parse(fs.readFileSync("./users/usernames/" + user + "/info.json"));
        if (userData.hashCode != hashcode) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }
    }

    if (notSpotifyGameMode){
        switch (gameMode) {
            case "50s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_50);
                break;
            case "60s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_60);
                break;
            case "70s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_70);
                break;
            case "80s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_80);
                break;
            case "90s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_90);
                break;
            case "00s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_2000);
                break;
            case "10s":
                trackData = await SelectPublicSpotifyPlaylistTrack(ALL_OUT_2010);
                break;
            case "top50":
                trackData = await SelectPublicSpotifyPlaylistTrack(TOP_50_GLOBAL);
                break;
            case "today":
                trackData = await SelectPublicSpotifyPlaylistTrack(TODAY_TOP);
                break;
            case "internationals":
                trackData = await SelectPublicSpotifyPlaylistTrack(INTER_HITS);
                break;
            case "rock":
                trackData = await SelectPublicSpotifyPlaylistTrack(ROCK);
                break;
            case "rockclassic":
                trackData = await SelectPublicSpotifyPlaylistTrack(ROCK_CLASSIC);
                break;
            case "dance":
                trackData = await SelectPublicSpotifyPlaylistTrack(DANCE);
                break;
            case "latino":
                trackData = await SelectPublicSpotifyPlaylistTrack(LATINO);
                break;
            case "rap":
                trackData = await SelectPublicSpotifyPlaylistTrack(RAP);
                break;
            case "country":
                trackData = await SelectPublicSpotifyPlaylistTrack(COUNTRY);
                break;
            default:
                res.json(makeErrorResponseBadRequest());
                return;
        }
    }
    

    if (trackData === null) {
        console.log("Track data is null");
        res.json(makeErrorResponseNotFound());
        return;
    }

    let lyricsResp = await RequestSongLyrics(trackData.title, trackData.artist);
    
    if (lyricsResp.status != 200) {
        console.log("LyricsRequest status not 200");
        res.json(makeErrorResponseNotFound());
        return;
    }
    if (lyricsResp.data.message.header.status_code != 200) {
        console.log("Lyrics header not 200");
        res.json(makeErrorResponseNotFound());
        return;
    }
    let lyricsObj = {
        "lyrics": lyricsResp.data.message.body.lyrics.lyrics_body,
        "pixel_tracking_url": lyricsResp.data.message.body.lyrics.pixel_tracking_url,
        "lyrics_copyright": lyricsResp.data.message.body.lyrics.lyrics_copyright
    }
    if (logType == "spotify"){
        SaveSongData(trackData, "./users/usertokens/" + user + "/song.json");
    } else {
        SaveSongData(trackData, "./users/usernames/" + user + "/song.json");
    }
    res.json(makeOKResponse(lyricsObj));
});

/**
 * Registers a submit from the website and returns the song info with the points calculated for the guess.
 * The request must be made using body data.
 * 
 * Body arguments:
 *  logtype     (spotify or lyricsguesser)  required
 *  hashcode    (server generated code)     required
 *  guess       (the song title guess)      required
 *  user        (spotify/lyricsguesser id)  required
 * 
 * JSON response:
 *  points          points awarded by this guess
 *  title           the actual title of the song
 *  artist          the actual artist of the song
 *  totalPoints     the user total points
 */
app.post("/submitGuess", (req, res) => {
    if(!validateOrigin(req)){
        res.json(makeErrorResponseForbidden());
        return;
    }

    let logType = req.body.logtype || undefined;
    let user = req.body.user || undefined;
    let hashcode = req.body.hashcode || undefined;

    if (logType != "spotify" && logType != "lyricsguesser") {
        res.json(makeErrorResponseUnauthorized());
        return;
    }
    if ((user === null || user === undefined) || (hashcode === null || hashcode === undefined)) {
        res.json(makeErrorResponseBadRequest());
        return;
    }

    let songData = null;

    if (logType == "spotify") {
        // spotify user

        if (!fs.existsSync("./users/usertokens/" + user)) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        let userData = JSON.parse(fs.readFileSync("./users/usertokens/" + user + "/info.json"));
        if (userData.hashcode != hashcode) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        if (!fs.existsSync("./users/usertokens/" + user + "/song.json")) {
            res.json(makeErrorResponseConflict());
            return;
        }
        songData = JSON.parse(fs.readFileSync("./users/usertokens/" + user + "/song.json"));
    } else {
        // lyricsguesser user

        if (!fs.existsSync("./users/usernames/" + user)) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        let userData = JSON.parse(fs.readFileSync("./users/usernames/" + user + "/info.json"));
        if (userData.hashCode != hashcode) {
            res.json(makeErrorResponseUnauthorized());
            return;
        }

        if (!fs.existsSync("./users/usernames/" + user + "/song.json")) {
            res.json(makeErrorResponseConflict());
            return;
        }
        songData = JSON.parse(fs.readFileSync("./users/usernames/" + user + "/song.json"));
    }

    let guess = req.body.guess || undefined;
    if (guess === null || guess === undefined) {
        guess = "";
    }

    let points = CalculateGuessPoints(ReformatSongTitle(songData.title), guess);

    // add points to user score
    let dirPath;
    if (logType == "spotify") {
        dirPath = "./users/usertokens/" + user + "/score.json";
    } else {
        dirPath = "./users/usernames/" + user + "/score.json";
    }
    let userScore = JSON.parse(fs.readFileSync(dirPath)).score;
    let updatedScore = userScore + points;

    fs.writeFileSync(dirPath, JSON.stringify({"score": updatedScore}));

    let responseData = {
        "points": points,
        "title": songData.title,
        "artist": songData.artist,
        "totalpoints": updatedScore
    }
    res.json(makeOKResponse(responseData));
});

// EVENT CYCLE
app.listen(PORT, () => {
    console.log("Backend server listening on port " + PORT)
});

InitAppAccessToken();
