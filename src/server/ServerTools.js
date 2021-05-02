function isAnybodyLeader(clientList)
{
  var f = false;
  clientList.forEach(client => {
    if(client.isLeader) return f = true;
  })
  return f;
}

function getTime(video)
{
  /* Gets the video's time in milliseconds */

  //if the video is paused then return the time when it was unpaused
  if(video.pause) return video.time;

  //set time and return time
  video.time = Date.now() - video.start;
  return video.time;
}

function playVideo(video, videoLink)
{
  video.link = videoLink;
  video.start = Date.now();
  video.pause = null;
  video.time = 0;
}

function togglePauseVideo(video)
{
  if(!video.pause) {
    //set time before pause
    video.time = Date.now() - video.start;

    video.pause = Date.now();
  } else {
    video.start = video.start + (Date.now() - video.pause);
    video.pause = null;

    //set time after unpause
    video.time = Date.now() - video.start;
  }
}

function seekVideo(video, time)
{
  if(video.pause) {
    //unpause the video
    togglePauseVideo(video);

    //seekVideo
    video.start = video.start - time;
    if(video.start > Date.now()) {
      video.start = Date.now();
    }

    //pause the video
    togglePauseVideo(video);

    //otherwise there will be errors
  } else {
    //seekVideo
    video.start = video.start - time;
    if(video.start > Date.now()) {
      video.start = Date.now();
    }
  }

  //set time after seek so changes take effect
  video.time = Date.now() - video.start;
}

function setTimeVideo(video, time)
{
  //do some math to set time
  seekVideo(video, time - getTime(video));
}


export {isAnybodyLeader, playVideo, seekVideo, togglePauseVideo, getTime, setTimeVideo};

