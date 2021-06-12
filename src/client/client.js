const io     = require("socket.io-client");
const ss     = require('socket.io-stream');
const client = io();

const leaderBtn      = document.getElementById("leader-btn");
const controlPanel   = document.getElementById("control-panel");
const videoPlayer    = document.getElementById("video-player");
const videoContainer = document.getElementById("video-container");
const progressBar    = document.getElementById("progress-bar");
const audioBtn       = document.getElementById("audio");
const volumeSlider   = document.getElementById("volume");
const thresholdInput = document.getElementById("threshold");

var threshold    = 400;
var currentVideo = {
  link: "",
  time: null,
  paused: false
}



client.on("leader", () => {
  //when client becomes leader, activate leaderBtn and addLeaderControls
  leaderBtn.classList.add("activated");
  addLeaderControls();
})

client.on("reload-subtitle", () => {
  //reload the subtitles for new ones
  reloadSubtitle();

  //send a notification for new subtitles
  showNotif("🎬 New subtitles have been applied!")
});

client.on("sync",   data => {sync(data.video)});

client.on("notify", data => {showNotif(data.message)});



function reloadSubtitle()
{
  fetch("/sub.vtt").then(res => {
    //if there is subtitle, then reload the subtitle
    if(res.ok) {
      //remove all track elements with track id
      document.querySelectorAll("#track").forEach(t => {t.remove()});

      //create new track element and append it to videoPlayer
      const track   = document.createElement("track");
      track.id      = "track";
      track.kind    = "subtitles";
      track.src     = "/sub.vtt";
      track.mode    = "showing";
      track.default = true;
      videoPlayer.appendChild(track);
    }
  })
}

function sync(video)
{
  //get whether server video is paused
  const paused = (video.pause != null);

  //change the paused button based on whether server video is paused
  const pauseBtn = document.getElementById("pause");
  if(pauseBtn) {
    if(paused) {
      pauseBtn.classList.add("activated");
      pauseBtn.textContent = "⏸";
    } else {
      pauseBtn.classList.remove("activated");
      pauseBtn.textContent = "▶";
    }
  }

  //if the src is not the same then change src
  if(videoPlayer.src != video.link) {
    videoPlayer.src   = video.link;
    currentVideo.link = video.link;

    //send a notification for new video
    showNotif("🎥 A new video has been played!")
  }

  //set the client videoTime to server videoTime
  videoPlayer.currentTime = video.time / 1000;
  currentVideo.time       = video.time;

  //set the currentVideo pause state
  currentVideo.paused = paused;

  //if video.time is greater than or equal to the videoPlayer duration then return
  if(video.time >= videoPlayer.duration * 1000)
    return;

  //pause the video accordingly
  if(paused != videoPlayer.paused) {
    if(paused) {
      videoPlayer.pause();
    } else {
      const playPromise = videoPlayer.play();

      // In browsers that don’t yet support this functionality,
      // playPromise won’t be defined.
      if(playPromise != undefined) {
        playPromise.then(() => {
          // Automatic playback started!
        }).catch(error => {
          // Automatic playback failed.
          // Show a UI element to let the user manually start playback.
        })
      }
    }
  }
}

function update()
{
  //set the currentVideo time
  currentVideo.time = videoPlayer.currentTime * 1000;

  //send a sync emit, pre-increase time by threshold to reduce lag
  client.emit("sync", {video: {...currentVideo, time: currentVideo.time + threshold}, threshold: threshold});

  //update after 200 milliseconds
  setTimeout(update, 200);

  //dont divide by 0 or by NaN
  if(!videoPlayer.duration)
    return;

  //update progress bar, change bar color based on whether video is paused
  const bar      = progressBar.children[0];
  const progress = videoPlayer.currentTime / videoPlayer.duration;

  bar.style.width = progress * 100 + "%";

  if(!currentVideo.paused && progress != 1)
    bar.style.backgroundColor = "#42f542";
  else
    bar.style.backgroundColor = "white";
}

function leaderControlsKeydown(event)
{
  const videoInput = document.getElementById("video-input");

  //if videoInput is focused or ctrl/alt is down, then dont react to keys
  if(document.activeElement == videoInput     ||
     document.activeElement == thresholdInput ||
     event.ctrlKey                            ||
     event.altKey)
     return;

  //if user presses a number (tests if event.key only has numbers in it)
  if(/^\d+$/.test(event.key)) {
    client.emit("set-time", {time: (parseInt(event.key) / 10) * videoPlayer.duration * 1000});
  }

  //compare keycode and act on key that is pressed
  switch(event.code) {
    case "Space":
      client.emit("toggle-pause");
      break;
    case "KeyP":
      client.emit("toggle-pause");
      break;
    case "KeyH":
      client.emit("seek", {time: -60000,   duration: videoPlayer.duration * 1000});
      break;
    case "KeyJ":
      client.emit("seek", {time: -1000,    duration: videoPlayer.duration * 1000});
      break;
    case "KeyK":
      client.emit("seek", {time: 1000,     duration: videoPlayer.duration * 1000});
      break;
    case "KeyL":
      client.emit("seek", {time: 60000,    duration: videoPlayer.duration * 1000});
      break;
    case "ArrowLeft":
      client.emit("seek", {time: -5000,    duration: videoPlayer.duration * 1000});
      break;
    case "ArrowRight":
      client.emit("seek", {time: 5000,     duration: videoPlayer.duration * 1000});
      break;
    case "Comma":
      client.emit("seek", {time: -1000/60, duration: videoPlayer.duration * 1000});
      break;
    case "Period":
      client.emit("seek", {time: 1000/60,  duration: videoPlayer.duration * 1000});
      break;
    default:
      //return if nothing matches
      return;
  }

  //if key matches with one of the switch cases, then prevent
  //default things from happening and only focus on the inputs
  event.preventDefault();
}

function addLeaderControls()
{
  const leaderControls    = document.createElement("section");
  const pause             = document.createElement("button");
  const videoInput        = document.createElement("input");
  const subtitleLabel     = document.createElement("label");
  const subtitleLabelIcon = document.createElement("i");
  const subtitle          = document.createElement("input");

  // set the id for each element
  leaderControls.id = "leader-controls";
  pause.id          = "pause";
  subtitle.id       = "subtitle";
  videoInput.id     = "video-input";

  //pause button styling
  pause.classList.add("button")

  if(currentVideo.paused) {
    pause.classList.add("activated");
    pause.textContent = "⏸";
  } else {
    pause.classList.remove("activated");
    pause.textContent = "▶";
  }

  //leaderControls styling
  leaderControls.style.display    = "flex";
  leaderControls.style.alignItems = "center";

  //make the subtitle button look prettier
  subtitleLabel.style.color    = "white";
  subtitleLabel.style.minWidth = "102.5px";
  subtitleLabel.htmlFor        = "subtitle";
  subtitleLabel.classList.add("file-upload");
  subtitleLabel.appendChild(subtitleLabelIcon);
  subtitleLabelIcon.classList.add("fa");
  subtitleLabelIcon.classList.add("fa-cloud-upload");
  subtitleLabel.innerHTML += " Subtitle";

  //set subtitle button to only accept vtt
  subtitle.type   = "file";
  subtitle.accept = ".vtt";

  //videoInput styling
  videoInput.classList.add("input");
  videoInput.type           = "text";
  videoInput.style.minWidth = "5rem";
  videoInput.placeholder    = "Video links go here...";

  //pause click event
  pause.addEventListener("click", () => {
    client.emit("toggle-pause");
  });

  subtitle.addEventListener("change", () => {
    //create the streams
    const file       = subtitle.files[0];
    const stream     = ss.createStream();
    const blobstream = ss.createBlobReadStream(file);

    //pipe the blobstream to stream
    ss(client).emit('subtitle', stream)
    blobstream.pipe(stream);
  })

  videoInput.addEventListener("keydown", event => {
    //if enter key is pressed and videoInput is not blank then play the link
    if(event.key == "Enter" && videoInput.value.trim())
      client.emit("play-video", {link: videoInput.value});
  })

  leaderControls.appendChild(pause);
  leaderControls.appendChild(videoInput);
  leaderControls.appendChild(subtitle);
  leaderControls.appendChild(subtitleLabel);
  controlPanel.appendChild(leaderControls);

  //add the leaderControls keybinds
  window.addEventListener("keydown", leaderControlsKeydown);
}

function removeLeaderControls()
{
  //remove all leaderControl elements
  document.querySelectorAll("#leader-controls").forEach(t => {t.remove()});

  //remove the leaderControls keybinds
  window.removeEventListener("keydown", leaderControlsKeydown);
}

function showNotif(text) {
  const container = document.createElement("div");
  const deleteBtn = document.createElement("button");
  container.classList.add("notification");
  container.classList.add("is-danger");
  deleteBtn.classList.add("delete");

  container.textContent           = text;
  container.style.position        = "absolute";
  container.style.bottom          = 0;
  container.style.right           = 0;
  container.style.transition      = "200ms transform";
  container.style.transform       = "translateY(100%)";
  container.style.backgroundColor = "black";
  container.style.border          = "2px solid red";

  deleteBtn.style.backgroundColor = "red";

  setTimeout(() => {
    container.style.transform = "translateY(0%)";
  }, 200)

  deleteBtn.addEventListener("click", () => {
    container.style.transform = "translateY(100%)";
    setTimeout(() => {container.remove()}, 200);
  })

  container.appendChild(deleteBtn);
  document.body.appendChild(container);
}

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  //set videoPlayer default volume to 50%
  videoPlayer.volume = 0.5;

  //reloads the subtitle when the videoPlayer has changed videos
  videoPlayer.addEventListener("loadedmetadata", reloadSubtitle);

  //start update loop after 200 milliseconds
  setTimeout(update, 200);

  // hide cursor on cursor inactivity on videoPlayer
  videoPlayer.addEventListener("mousemove", function foo() {
    videoPlayer.style.cursor  = "default";
    progressBar.style.opacity = "1.0";

    clearTimeout(foo.moved);

    foo.moved = setTimeout(() => {
      videoPlayer.style.cursor = "none";
      if(document.fullscreenElement == videoContainer) {
        progressBar.style.opacity = "0.0";
      }
    }, 1000)
  })

  progressBar.addEventListener("click", event => {
    // get percentage by diving mouse x by body width
    const percentage = event.clientX / document.body.clientWidth;

    // set video time using percentage
    client.emit("set-time", {time: percentage * videoPlayer.duration * 1000});
  })

  audioBtn.addEventListener("click", () => {
    //toggle videoPlayer muted state
    videoPlayer.muted = !videoPlayer.muted;

    //change autoBtn class based on muted state
    if(!videoPlayer.muted)
      audioBtn.classList.add("activated");
    else
      audioBtn.classList.remove("activated");
  })

  leaderBtn.addEventListener("click", () => {
    //pretends to remove leader stuff
    leaderBtn.classList.remove("activated");
    removeLeaderControls();

    client.emit("toggle-leader")
  });

  volumeSlider.addEventListener("input", () => {
    //unmute and set the volume
    videoPlayer.muted  = false;
    videoPlayer.volume = volumeSlider.value / 100;

    //change the look of audioBtn to look activated
    audioBtn.classList.add("activated");
  })

  thresholdInput.addEventListener("change", () => {
    //get threshold from input
    threshold = parseInt(thresholdInput.value);

    //if input value is not a number or if threshold is negative, then default to 400
    if(isNaN(threshold) || threshold < 0)
      threshold = 400;
  })

  videoPlayer.addEventListener("click", function foo() {
    // debounce is a static variable :0
    if(typeof foo.debounce == 'undefined') {
      foo.debounce = false;
    }

    // blocks the user from starting this function again
    // until removeEventListener has been called
    if(foo.debounce) return;
    foo.debounce = true;

    function fullscreenFunction() {
      if(!document.fullscreenElement) {
        if(videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if(videoContainer.webkitRequestFullscreen) { /* Safari */
          videoContainer.webkitRequestFullscreen();
        } else if(videoContainer.msRequestFullscreen) { /* IE11 */
          videoContainer.msRequestFullscreen();
        }
      } else {
        if(document.exitFullscreen) {
          document.exitFullscreen();
        } else if(document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if(document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      }
    }

    // if the user clicks again within 250 seconds, then go into fullscreen
    videoPlayer.addEventListener("click", fullscreenFunction);

    setTimeout(() => {
      videoPlayer.removeEventListener("click", fullscreenFunction);
      foo.debounce = false;
    }, 250)
  })

  document.addEventListener("fullscreenchange", () => {
    // document.fullscreenElement will point to the element that
    // is in fullscreen mode if there is one. If there isn't one,
    // the value of the property is null.
    if(document.fullscreenElement == videoContainer) {
      videoPlayer.style.height   = "100%";
      progressBar.style.position = "absolute";
    } else {
      videoPlayer.style.height   = "calc(100% - 10px)";
      progressBar.style.position = "relative";
    }
  });
});

