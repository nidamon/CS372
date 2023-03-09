var dataBaseModule = require('./databaseModule.js')


// function to create HTML list of videos
exports.createVideoList = async function() {
    let html = '';
    for (let i = 0; i < videos.length; i++) {
        html += `<div>
            <h3>${videos[i].title}</h3>
            <p>Uploaded by: ${videos[i].user}</p>
            <p>Comment: ${videos[i].comment}</p>
            ${videos[i].em}
            <p><a href="/video/${videos[i]._id}">${videos[i].clickCount} clicks</a></p>
            </div>`;
    }
    return(html);
};