var dataBaseModule = require('./databaseModule.js')

// Creates an html page that displays the videos that have been passed to it
exports.createVideoList = async function(videos, callback_HTMLData) {
    let html = '<h3>Movies</h3>';

    // Add the CSS for the row-column format and repeating backgound
    html +=
    `<style>
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
            background-image: url('images/website_background3.jpg');
            background-repeat: repeat-y;
          }
    </style>`;

    html += `
    <form method="post">
        <input id='txtVideoSearchName' type='text' placeholder='Search by Title' name='videoNameSearch'>
        <input id='txtVideoSearchGenre' type='text' placeholder='Search by Genre' name='videoGenreSearch'>
        <button id='btnSubmitSearch' type='submit' >Search</button>
    </form>`;
    try {
        html += `<div class="video-container">`;
        for (let i = 0; i < videos.length; i++) {
            html += `<div class="video-thumbnail">
            <a href="/video/${encodeURI(videos[i].videoName)}" title="${videos[i].videoName}" 
            data-toggle="tooltip">
            <img src="${videos[i].videoThumbnail}" 
            alt="${videos[i].videoName} thumbnail" width="240" height="135">
            </a>
            <p>${videos[i].videoName}</p>          
            </div>`;
        }
        html += `</div>`;

        // Add upload video button
        html +=
        `<div class="videoUploadBtn">  
        <br>      
        <button type='button' id='btnVideoUploadPage' onclick="window.location.href='videoupload.html'">Upload a video</button>
        </div>`
        
        // Toggle popovers
        html +=
        `<script>
            $(document).ready(function(){
                $('[data-toggle="tooltip"]').tooltip();
            });
        </script>`;

        callback_HTMLData(html);
    }
    catch{
        html = 'Glitched loading'
        callback_HTMLData(html);
    }
};

// Creates a video watching page and sends it with a fetch to retrieve more after.
exports.sendVideoPage = function(res, videoData)
{
    let html = `<h3>${videoData.videoName}</h3>`;
    try {     
        html += 
        `<iframe width="960" height="540" src="https://www.youtube.com/embed/${videoData.videoEmbedLink}" 
        title="YouTube video player" frameborder="0" allow="accelerometer; 
        autoplay; clipboard-write; encrypted-media; gyroscope; 
        picture-in-picture; web-share" allowfullscreen></iframe>
        <p>Comment: ${videoData.videoComment}</p>
        <body onload=retrieveAdditionalVideoData()>
            <div id="roleBasedArea"></div>
        </body>`;  
        html += addFetchingForVideoPage(videoData.videoName);  
       
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    }
    catch(err){
        console.log(err);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        html = 'Failed to load content'
        res.end(html);
    }
};

// Fetch code to get role-based additions to the video page
function addFetchingForVideoPage(videoName)
{
    return `<script>
        function retrieveAdditionalVideoData()
        {        
            const url = "${videoName}/" + sessionStorage.getItem("AccountType");       
            fetch(url) // About fetch: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data
            .then( response => {
                if (!response.ok) {
                throw new Error(\`HTTP error: \${response.status}\`);
                }
                return response.text();
            })          
            .then( html => { // When response.text() has succeeded
                document.getElementById("roleBasedArea").innerHTML = html;
            })
            .catch(error => { console.log("Fetch error")});        
        }
        </script>`;
};
