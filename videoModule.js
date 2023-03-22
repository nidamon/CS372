var dataBaseModule = require('./databaseModule.js')

// Creates an html page that displays the videos that have been passed to it
exports.createVideoList = async function(videos, serverBaseAddress, callback_HTMLData) {
    let html = '<h3>Movies</h3>';

    html += videoWrapAndBackgound(serverBaseAddress);

    html += addButtonsAndSearching();
    try {
        html += `<div class="video-container">`; //needed for videoWrapAndBackgound()
        for (let i = 0; i < videos.length; i++) {
            html += addVideoToList(videos[i])
        }
        html += `</div>`;

        // Add upload video button
        html += addUploadButton();
        // Toggle popovers
        html += addTooltipToggle();

        callback_HTMLData(html);
    }catch{
        html = 'Glitched loading'
        callback_HTMLData(html);
    }
}

function addButtonsAndSearching()
{
    // Search by name and/or genre
    // Search button
    // Logout button
    return `
    <form method="post">
        <input id='txtVideoSearchName' type='text' placeholder='Search by Title' name='videoNameSearch'>
        <input id='txtVideoSearchGenre' type='text' placeholder='Search by Genre' name='videoGenreSearch'>
        <button id='btnSubmitSearch' type='submit' >Search</button>
        <button type='button' id='btnLogout' onclick="(function(){ 
            let uname = sessionStorage.getItem('UserId'); 
            window.location.href=('logout/' + uname);
            })()">Logout</button>
    </form>`;
}
function addVideoToList(video)
{
    // Video display on listings page
    return `<div class="video-thumbnail">
    <a href="/video/${encodeURI(video.videoName)}" title="${video.videoName}" 
    data-toggle="tooltip">
        <img src="${video.videoThumbnail}" alt="${video.videoName} thumbnail" width="240" height="135">
    </a>
    <p>${video.videoName}</p>          
    </div>`;
    
}
function addUploadButton()
{
    return `<div class="videoUploadBtn">  
    <br>      
    <button type='button' id='btnVideoUploadPage' onclick="window.location.href='videoupload.html'">Upload a video</button>
    </div>`;
}
function addTooltipToggle()
{
    // Turns tooltips on
    return `<script>
    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
    });
    </script>`;
}

// Creates a video watching page and sends it with a fetch to retrieve more after.
exports.sendVideoPage = function(res, videoData, serverBaseAddress)
{
    let html = `<h3>${videoData.videoName}</h3>`;
    html += videoWrapAndBackgound(serverBaseAddress);  

    try {     
        html += // Embeded youtube video, comment, and html body for adding role based actions on fetch
        `<body onload=retrieveAdditionalVideoData()>
            <button type='button' id='btnBackToMovies' onclick="window.location='${serverBaseAddress}/landingpage'">Back To Movies</button>
            <br>
            <div class="video-container"> <!-- Needed for videoWrapAndBackgound() -->
            <iframe width="960" height="540" src="https://www.youtube.com/embed/${extractVideoId(videoData.videoEmbedLink)}" 
            title="YouTube video player" frameborder="0" allow="accelerometer; 
            autoplay; clipboard-write; encrypted-media; gyroscope; 
            picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
            <p>Comment: ${videoData.videoComment}</p>   
            <div id="roleBasedArea"></div>
        </body>`;  
        html += addFetchingForVideoPage(videoData.videoName, serverBaseAddress);       
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    }
    catch(err){
        console.log(err);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        html = 'Failed to load content'
        res.end(html);
    }
}
// Fetch code to get role-based additions to the video page
function addFetchingForVideoPage(videoName, serverBaseAddress)
{
    return `<script>
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
                    window.location = '${serverBaseAddress}/loginpage.html';
                else
                    document.getElementById("roleBasedArea").innerHTML = html;
            })
            .catch(error => { console.log("Fetch error")});        
        }
        </script>`;
}
// Add the CSS for the row-column format and repeating backgound
function videoWrapAndBackgound(serverBaseAddress)
{
    return `<style>
        .video-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            }
        .video-thumbnail {
            margin: 10px;
            text-align: center;
        }
        body {
            background-image: url('${serverBaseAddress}/images/website_background2.jpg');
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
    if (match == null){
        return null
    }
    return match[1];
}

