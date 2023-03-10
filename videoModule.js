var dataBaseModule = require('./databaseModule.js')
// Search for Genre: Lofi 



exports.createVideoList = async function(videos, callback_HTMLData) {
    let html = '<h3>Lofi Genre</h3>';
    try {
    /*
    let videos = await new Promise((resolve, reject) => {
      dataBaseModule.getVideos("", "Lofi", function(videos) {
        resolve(videos);
      });
    });
    */
    console.log(videos);
    for (let i = 0; i < videos.length; i++) {
      html += `<div>
          <p>${videos[i].videoName}, Uploaded by: ${videos[i].videoUploader}</p>
          <iframe width="240" height="135" src="https://www.youtube.com/embed/${videos[i].videoEmbedLink}" 
          title="YouTube video player" frameborder="0" allow="accelerometer; 
          autoplay; clipboard-write; encrypted-media; gyroscope; 
          picture-in-picture; web-share" allowfullscreen></iframe>
          <p>Comment: ${videos[i].videoComment}</p>
          <p><a href="/video/${videos[i]._id}">${videos[i].videoViewCount} clicks</a></p>
          </div>`;
    }

    html +=
    `<div class="videoUploadBtn">  
      <br>      
      <button type='button' id='btnVideoUploadPage' onclick="window.location.href='videoupload.html'">Upload a video</button>
    </div>`;
    //return html;
    callback_HTMLData(html);
    }
    catch{
        html = 'Glitched loading'
        callback_HTMLData(html);
    }
  };
  
  /*
  async function test() {
    var result = await exports.createVideoList();
    console.log(result);
    console.log("hello");
  }
  test();
  */
  