async function OnPlayLoad(){
    navload();
    let logtype = localStorage.getItem("logtype");
    
    if (logtype != undefined && logtype != null){
        /* MOSTRO LE MODALITA DI LYRICSGUESSER */

        gmdiv = document.getElementById("gamemodes-div").style.display = "flex";;

        if (logtype == "spotify"){
            /* CARICO MODALITA DI SPOTIFY */
            document.getElementById("spotify-gamemodes").style.display = "flex";

            header = document.createElement("div");
            header.className = "modes-header";
            header.innerText = "SPOTIFY MODES";

            list = document.createElement("ul");
            list.className = "gamemodes-list";

            // PRIMO ELEMENTO
            item1 = document.createElement("li");
            item1.onclick = () => {
                window.location.href = "game.html?gamemode=favorites";
            }
            divgm = document.createElement("div");
            divgm.className =  "gamemode";
            a = document.createElement("a");
            a.href = "game.html?gamemode=favorites";
            a.innerText = "FAVORITES";
            divgm.appendChild(a);

            divdesc = document.createElement("div");
            divdesc.className =  "gamemode-description";
            p = document.createElement("p");
            p.innerText = " You'll be guessing songs from your own Spotify FAVOURITES playlist. ";
            divdesc.appendChild(p);

            item1.appendChild(divgm);
            item1.appendChild(divdesc);


            // SECONDO ELEMENTO
            item2 = document.createElement("li");
            item2.onclick = () => {
                window.location.href = "game.html?gamemode=playlists";
            }
            divgm = document.createElement("div");
            divgm.className =  "gamemode";
            a = document.createElement("a");
            a.href = "game.html?gamemode=playlists";
            a.innerText = "PLAYLISTS";
            divgm.appendChild(a);

            divdesc = document.createElement("div");
            divdesc.className =  "gamemode-description";
            p = document.createElement("p");
            p.innerText = " You'll be guessing songs from any of your Spotify playlist, created or followed. ";
            divdesc.appendChild(p);

            item2.appendChild(divgm);
            item2.appendChild(divdesc);

            list.appendChild(item1);
            list.appendChild(item2);

            document.getElementById("spotify-gamemodes").appendChild(header);
            document.getElementById("spotify-gamemodes").appendChild(list);
        } else {
            document.getElementById("spotify-unlogged").style.display = "flex";
        }
    } else {
        document.getElementById("gamemodes-div-unlogged").style.display = "flex";
        document.getElementById("spotify-unlogged").style.display = "flex";
    }       
}