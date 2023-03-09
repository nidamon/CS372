var dataBaseModule = require('./databaseModule.js')
// Search for Genre: Lofi 



exports.createVideoList = async function() {
    let html = '<h3>Lofi Genre</h3>';
    let videos = await new Promise((resolve, reject) => {
      dataBaseModule.getVideos("", "Lofi", function(videos) {
        resolve(videos);
      });
    });
    console.log(videos);
    for (let i = 0; i < videos.length; i++) {
      html += `<div>
          <p>${videos[i].videoName}, Uploaded by: ${videos[i].videoUploader}</p>
          ${videos[i].videoEmbedLink}
          <p>Comment: ${videos[i].videoComment}</p>
          <p><a href="/video/${videos[i]._id}">${videos[i].videoViewCount} clicks</a></p>
          </div>`;
    }

    html +=
    `<div class="videoUploadBtn">  
      <br>      
      <button type='button' id='btnVideoUploadPage' onclick="window.location.href='videoupload.html'">Upload a video</button>
    </div>`;
    return html;
  };
  
  
  async function test() {
    var result = await exports.createVideoList();
    console.log(result);
    console.log("hello");
  }
  test();
  