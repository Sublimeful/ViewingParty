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
  //if the video is paused then return the time when it was unpaused
  if(video.pause) return video.time;
  //set time
  video.time = Date.now() - video.start;
  return Date.now() - video.start;
}

function playVideo(video, videoLink)
{
  video.link = videoLink;
  video.start = Date.now();
  video.pause = null;
}

function togglePauseVideo(video)
{
  if(!video.pause) { //unpaused
    video.pause = Date.now();
  } else { //paused
    video.start = video.start + (Date.now() - video.pause);
    video.pause = null;
  }
}


function seekVideo(video, time)
{
  if(video.pause) {
    //if video is paused then unpause then seek and then pause again
    togglePauseVideo(video);
    video.start = video.start - time;
    if(video.start > Date.now()) {
      video.start = Date.now();
    }
    togglePauseVideo(video);
  } else {
    video.start = video.start - time;
    if(video.start > Date.now()) {
      video.start = Date.now();
    }
  }
  //set time
  video.time = Date.now() - video.start;
}


export {isAnybodyLeader, playVideo, seekVideo, togglePauseVideo, getTime, videoVerifier};

