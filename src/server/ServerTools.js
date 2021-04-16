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
  return Date.now() - video.start;
}

function playVideo(video, videoLink)
{
  video.link = videoLink;
  video.start = Date.now();
  video.pause = null;
}

function seekVideo(video, time)
{
  video.start = video.start - time;
  if(video.start > Date.now()) {
    video.start = Date.now();
  }
}


export {isAnybodyLeader, playVideo, seekVideo, getTime, videoVerifier};

