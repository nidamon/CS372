const videoThumbnailWidth = 240;
const videoThumbnailHeight = 135;

//max width and height of the video player specified in the style sheet
const videoWidth = 960;
const videoHeight = 540;

// Creates an html page that displays the videos that have been passed to it
exports.createVideoList = async function (videos, callback_HTMLData) {
    let html = `<body onload=isUser() class="backgroundImg2 center">
    <head> <title>Landing Page</title> 
    <link rel="stylesheet" href="chillflixStyleSheet.css">
    <link rel="icon" href="/images/ChillflixLogo.ico" type="image/x-icon">
    </head>
    <img src="images/ChillflixLogo.png" alt="chillflix logo" class="logo small"
    onclick="window.location.href='home.html'">`

    html += addButtonsAndSearching();
    try {
        if (videos.length > 0) {
            html += `<div class="videoContainer">`;
            for (let i = 0; i < videos.length; i++) {
                html += addVideoToList(videos[i]);
            }
            html += `</div>`;
        } else {
            html += noResults();
        }
        html += addUploadButton();
        html += addInvalidUserRdirect();
        html += addLandingPageScripts();

        callback_HTMLData(html);
    } catch {
        html = 'Glitched loading'
        callback_HTMLData(html);
    }
    html += `</body>`;
}

// html no results found gives a button to clear the search
function noResults() {
    return `<div class="textBoxSalmon"> 
    <strong>No search results</strong><br>
    <button id='btnClearSearch'>Clear Search</button>
    </div><br>
    <script>
      document.getElementById('btnClearSearch').addEventListener('click', function() {
        clearSearch();
        document.getElementById('btnSubmitSearch').click();
      });
    </script>`;
}


// html script to redirect invalid users to not-in-my-house.html
function addInvalidUserRdirect() {
    return `<script>
        function isUser()
        {
            if (sessionStorage.getItem("UserId") == null){
                window.location = '/notInMyHouse.html';
            }
        }
        </script>`
}
function addButtonsAndSearching() {
    // Search by name and/or genre
    // Search button
    // Logout button
    return `<div class ='center'>
        <form method="post" class = 'textBoxBlue' id="formVideoSearch">
            <input id='txtVideoSearchName' type='text' placeholder='Search by Title' name='videoNameSearch'>
            <input id='txtVideoSearchGenre' type='text' name='videoGenreSearch' hidden>
            ${addGenreDropdown()}
            <button id='btnSearchClear' type='button' onclick="clearSearch()">Clear</button>
            <button id='btnSubmitSearch' type='button' onclick="storeSearch()">Search</button>
            <button type='button' id='btnLogout' onclick="(function(){ 
                let uname = sessionStorage.getItem('UserId'); 
                window.location.href=('logout/' + uname);
                })()">Logout</button>
        </form>
    </div>`;
}
function addVideoToList(video) {
    // Video display on listings page
    return `<div class="videoThumbnail">
    <a href="/video/${encodeURI(video.videoName)}" title="${video.videoName}" 
    data-toggle="tooltip">
        <img src="${video.videoThumbnail}" alt="${video.videoName} thumbnail" 
        width="${videoThumbnailWidth}" height="${videoThumbnailHeight}">
    </a>
    <p>${video.videoName}</p> 
    </div>`;

}
function addUploadButton() {
    return `<div class="videoUploadBtn textBoxBlue">  
    <br>      
    <button type='button' id='btnVideoUploadPage' onclick="window.location.href='videoupload.html'">Upload a video</button>
    </div>`;
}
function addGenreDropdown() {
    return `
    <div class="dropdown">
        <button type="button">Genres</button>
        <div id="genreDropdownOptions" class="dropdown-options">
        </div>
    </div>`;
}
function addLandingPageScripts(){
    let html = addTooltipToggle();
    html += addFetchingForGenreDropdown();
    html += addDropdownHandle();
    html += addSearchStoreAndPopulate();
    return html;
}
function addTooltipToggle() {
    return `<script>
    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
    });
    </script>`;
}
function addFetchingForGenreDropdown() {
    return `<script>
        populateGenres();
        function populateGenres() {
            const url = 'genrelist';
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(\`HTTP error: \${response.status}\`);
                    }
                    return response.text();
                })
                .then(genreList => { // When response.text() has succeeded
                    let genreDropdownOptions = "";
                    JSON.parse(genreList).forEach(genre => {
                        genreDropdownOptions +=  
                        \`<label><input type="checkbox" id="box\${genre}" onclick="toggleInGenresArray('\${genre}')">\${genre}</label>\`;
                    });
                    document.getElementById("genreDropdownOptions").innerHTML = genreDropdownOptions;
                    populateSearchParams();
                })
                .catch(error => setReqText(\`Could not get genre list: \${error}\`));
        }
        </script>`;
}
function addDropdownHandle() {
    // Adds the given genre to the list of genres for the current video upload
    return `<script>
        let genresArray = [];
        function toggleInGenresArray(newGenre)
        {
            if(newGenre != '') {
                const index = genresArray.indexOf(newGenre);
                if (index > -1) { // Only splice array when item is found
                    genresArray.splice(index, 1); // 2nd parameter means remove one item only
                } else {
                    genresArray.push(newGenre);
                }
            }
            let videoGenres = ""; // Populate the search
            genresArray.forEach(genre => {
                videoGenres += genre + " ";
                if (document.getElementById('box' + genre) != null)
                    document.getElementById('box' + genre).checked = true;                
            })
            document.getElementById('txtVideoSearchGenre').value = videoGenres;
        }
        </script>`;
}
function addSearchStoreAndPopulate() {
    return `<script>
        function storeSearch() {
            sessionStorage.setItem("PreviousTitleSearch", document.getElementById('txtVideoSearchName').value);
            sessionStorage.setItem("PreviousSearchGenres", document.getElementById('txtVideoSearchGenre').value);
            document.getElementById('formVideoSearch').submit();
        }        
        function clearSearch() {
            document.getElementById('txtVideoSearchName').value = "";
            document.getElementById('txtVideoSearchGenre').value = "";
            sessionStorage.setItem("PreviousTitleSearch", "");
            sessionStorage.setItem("PreviousSearchGenres", "");
            genresArray.forEach(genre => {
                if (document.getElementById('box' + genre) != null)
                    document.getElementById('box' + genre).checked = false;                
            })       
            genresArray = [];
        }
        function populateSearchParams() {
            document.getElementById('txtVideoSearchName').value = sessionStorage.getItem('PreviousTitleSearch');
            document.getElementById('txtVideoSearchGenre').value = sessionStorage.getItem('PreviousSearchGenres');
            genres = document.getElementById('txtVideoSearchGenre').value;
            genres.split(' ').forEach(genre => {
                toggleInGenresArray(genre);
            })
        }
        </script>`;
}

// Creates a video watching page and sends it with a fetch to retrieve more after.
exports.sendVideoPage = function (res, videoData) {
    try {
        let html = `
            <head><title>ChillFlix</title><link rel="stylesheet" href="/chillflixStyleSheet.css">
            <link rel="icon" href="/images/ChillflixLogo.ico" type="image/x-icon"></head>
            <body class="backgroundImg2 center"> <div class="textBoxSalmon">
                <h3>${videoData.videoName}</h3>
                <button type='button' id='btnBackToMovies' onclick="window.location='/landingpage'">Back To Movies</button>
                </div><br><br>
                <div class="embededVideoContainer">
                <iframe width="${videoWidth}" height="${videoHeight}" 
                src="https://www.youtube.com/embed/${extractVideoId(videoData.videoEmbedLink)}" 
                title="YouTube video player" frameborder="0" allow="encrypted-media; 
                picture-in-picture" allowfullscreen></iframe>
                </div><br> <div class="textBoxSalmon">
                <p><strong>Genre:</strong> ${videoData.videoGenre}</p>
                <p><strong>Comment:</strong> ${videoData.videoComment}</p>
                <div id="roleBasedArea"></div></div>
                ${addFetchingForVideoPage(videoData.videoName)}
            </body>`;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } catch (err) {
        console.log(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to load content');
    }
}

// Fetch code to get role-based additions to the video page
function addFetchingForVideoPage(videoName) {
    return `<script>
        retrieveAdditionalVideoData()
        function retrieveAdditionalVideoData()
        {        
            const url = "${videoName}/" + sessionStorage.getItem("AccountType") + "/" + sessionStorage.getItem("UserId");       
            fetch(url) // About fetch: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data
            .then( response => {
                if (!response.ok) {
                    throw new Error(\`HTTP error: \${response.status}\`);
                }
                return response.text();
            })          
            .then( html => { // When response.text() has succeeded
                console.log("Html:" + html + ":");
                if(html == "sendToLogin")
                    window.location.replace('/loginpage.html');
                else
                    document.getElementById("roleBasedArea").innerHTML = html;
            })
            .catch(error => { console.log("Fetch error")});        
        }
        </script>`;
}
// Exracts the video ID form a youtube link.
function extractVideoId(url) {
    const regExpression = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?/;
    const match = url.match(regExpression);
    if (match == null) {
        return null
    }
    return match[1];
}
