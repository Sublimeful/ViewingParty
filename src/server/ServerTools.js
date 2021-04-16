function isAnybodyLeader(clientList)
{
  var f = false;
  clientList.forEach(client => {
    if(client.isLeader) return f = true;
  })
  return f;
}

function videoVerifier(videoLink)
{
  return true;
}

/* Gets the video's time in milliseconds */
function getTime(video)
{
  video.time
  return Date.now() - video.start;
}

function playVideo(video, videoLink)
{
  video.link = videoLink;
  video.start = Date.now();
  video.pause = null;
}


export {isAnybodyLeader, playVideo, getTime, videoVerifier};

