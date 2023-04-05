const videoThumbnailWidth = 240;
const videoThumbnailHeight = 135;
const videoWidth = 960;
const videoHeight = 540;

// Creates an html page that displays the videos that have been passed to it
exports.createVideoList = async function (videos, callback_HTMLData) {
    let html = `<body onload=isUser() class="backgroundImg2 center">
    <head> <title>Landing Page</title> 
    <link rel="stylesheet" href="chillflixStyleSheet.css">
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
            html += `No search results`;
        }
        html += addUploadButton();
        html += addTooltipToggle();
        html += addInvalidUserRdirect();

        callback_HTMLData(html);
    } catch {
        html = 'Glitched loading'
        callback_HTMLData(html);
    }
    html += `</body>`;
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
        <form method="post" class = 'textBoxBlue'>
            <input id='txtVideoSearchName' type='text' placeholder='Search by Title' name='videoNameSearch'>
            <input id='txtVideoSearchGenre' type='text' placeholder='Search by Genre' name='videoGenreSearch'>
            <button id='btnSubmitSearch' type='submit' >Search</button>
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
function addTooltipToggle() {
    return `<script>
    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
    });
    </script>`;
}

// !!!!!!!!!!!!!! BROKEN CURRENTLY !!!!!!!!!!!!!!
// Creates a video watching page and sends it with a fetch to retrieve more after.
exports.sendVideoPage = function (res, videoData) {
    let html = `<h3>${videoData.videoName}</h3> 
    <head> <link rel="stylesheet" href="chillflixStyleSheet.css"> </head>`;

    // Temp Fix
    html += `<style>
    body {
        background-image: url('/images/website_background2.jpg');
        background-repeat: repeat;
        background-attachment: fixed;  
        background-size: cover;
        text-align: center;
    }
    </style>`;

    try {
        html += // Embeded youtube video, comment, and html body for adding role based actions on fetch
            `<body class="backgroundImg2 center">
            <button type='button' id='btnBackToMovies' onclick="window.location='/landingpage'">Back To Movies</button>
            <br>
            <iframe width="${videoWidth}" height="${videoHeight}" 
            src="https://www.youtube.com/embed/${extractVideoId(videoData.videoEmbedLink)}" 
            title="YouTube video player" frameborder="0" allow="accelerometer; 
            autoplay; clipboard-write; encrypted-media; gyroscope; 
            picture-in-picture; web-share" allowfullscreen></iframe>
            <div class="textBoxBlue">
            <p>Comment: ${videoData.videoComment}</p>   
            <div id="roleBasedArea"></div>
            </div>
            </body>`;
        html += addFetchingForVideoPage(videoData.videoName);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    catch (err) {
        console.log(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        html = 'Failed to load content'
        res.end(html);
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
// Add the CSS for the row-column format and repeating backgound
function videoWrapAndBackgound() {
    return `<style>
        body {
            background-image: url('/images/website_background2.jpg');
            background-repeat: repeat;
            background-attachment: fixed;  
            background-size: cover;}
        }
    </style>`;

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
