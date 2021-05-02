const io = require("socket.io-client");
const ss = require('socket.io-stream');
const socket = io();

const leaderBtn = document.getElementById("leader-btn")
const controlPanel = document.getElementById("control-panel")
const player = document.getElementById("video-player")
const progressBar = document.getElementById("progress-bar")
const audioBtn = document.getElementById("audio")
const volumeSlider = document.getElementById("volume")
const thresholdInput = document.getElementById("threshold")

var threshold = 200;
var currentVideo = {
  link: "",
  time: null,
}



volumeSlider.addEventListener("input", () => {
  audioBtn.classList.add("activated");
  player.muted = false;
  player.volume = volumeSlider.value / 100;
})

audioBtn.addEventListener("click", () => {
  player.muted = !player.muted;
  if(!player.muted) {
    audioBtn.classList.add("activated");
  } else {
    audioBtn.classList.remove("activated");
  }
})

thresholdInput.addEventListener("change", () => {
  //get threshold from input
  threshold = parseInt(thresholdInput.value);
  if(isNaN(threshold)) threshold = 200;
})

leaderBtn.addEventListener("click", () => {
  socket.emit("toggle-leader");
});

socket.on("leader", () => {
  leaderBtn.classList.add("activated");
  addLeaderControls();
})

socket.on("unleader", () => {
  leaderBtn.classList.remove("activated");
  removeLeaderControls();
})

socket.on("sync", data => {
  sync(data.video);
})

socket.on("reload-subtitle", reloadSubtitle);

socket.on("debug", data => {
  console.log("DEBUG: " + data);
})

function reloadSubtitle()
{
  fetch("/sub.vtt").then(res => {
    if(res.ok) {
      //if there is subtitle, then reload the subtitle

      //remove all track elements
      while(document.getElementById("track"))
        document.getElementById("track").remove();

      //create new track element and append it to player
      const track = document.createElement("track");
      track.kind = "captions";
      track.label = "English";
      track.srclang = "en";
      track.src = "/sub.vtt";
      track.id = "track";
      track.mode = "showing";
      track.default = true;
      player.appendChild(track);
    }
  })
}

function sync(video)
{
  const videoLink = video.link;

  //offset time by threshold to counter lag
  const videoTime = video.time + threshold;

  //if the src is not the same then change src
  if(player.src != videoLink) {
    currentVideo.link = videoLink;
    player.src = videoLink;
  }

  //get whether server video is paused
  const paused = (video.pause != null);

  //change the paused button based on paused
  if(document.getElementById("pause"))
  {
    const pauseBtn = document.getElementById("pause");
    if(paused) {
      pauseBtn.classList.add("activated");
      pauseBtn.textContent = "⏸";
    } else {
      pauseBtn.classList.remove("activated");
      pauseBtn.textContent = "▶";
    }
  }

  //convert milliseconds to seconds and set the player's time
  player.currentTime = videoTime / 1000;

  //if videoTime is greater than or equal to the player duration then return
  if(videoTime / 1000 >= player.duration) return;

  //pause the video accordingly
  if(paused != player.paused) {
    if(paused)
      player.pause();
    else
      player.play();
  }
}

function update()
{
  //set the currentVideo time(convert to milliseconds)
  currentVideo.time = player.currentTime * 1000;

  //send a sync emit
  socket.emit("sync", {video: currentVideo, threshold: threshold});

  //update after 200 milliseconds
  setTimeout(update, 200);

  //dont divide by 0 or by NaN
  if(!player.duration) return;

  //update progress bar
  const bar = progressBar.children[0];
  const progress = player.currentTime / player.duration;

  bar.style.width = progress * 100 + "%";
}

function togglePause()
{
  //toggle pause button activation
  socket.emit("toggle-pause");

  const pause = document.getElementById("pause");
  if(pause.classList.contains("activated")) {
    pause.classList.remove("activated");
    pause.textContent = "▶";
  } else {
    pause.classList.add("activated");
    pause.textContent = "⏸";
  }
}

function leaderControlsKeydown(event)
{
  //if videoInput is focused or ctrl/alt is down, then dont react to keys
  const videoInput = document.getElementById("video-input");
  if(document.activeElement == videoInput     ||
     document.activeElement == thresholdInput ||
     event.ctrlKey                            ||
     event.altKey) return;

  //if user presses a number
  if(event.code.includes("Digit")) {
    const num = parseInt(event.code[event.code.length - 1]);
    const time = num / 10 * player.duration * 1000;
    if(!isNaN(time))
      socket.emit("set-time", {time: time});
  }

  //compare keycode and act on key that is pressed
  switch(event.code)
  {
    case "Space":
      togglePause();
      break;
    case "KeyP":
      togglePause();
      break;
    case "KeyH":
      socket.emit("seek", {time: -60000});
      break;
    case "KeyJ":
      socket.emit("seek", {time: -10000});
      break;
    case "KeyK":
      socket.emit("seek", {time: 10000});
      break;
    case "KeyL":
      socket.emit("seek", {time: 60000});
      break;
    case "ArrowLeft":
      socket.emit("seek", {time: -5000});
      break;
    case "ArrowRight":
      socket.emit("seek", {time: 5000});
      break;
    default:
      //return if nothing matches
      return;
  }

  //if key matches with one of the switch cases, then
  //prevent default things from happening and only focus on the inputs
  event.preventDefault();
}

function addLeaderControls()
{
  const leaderControls = document.createElement("section");
  const pause = document.createElement("button");
  const seekBTiny = document.createElement("button");
  const videoInput = document.createElement("input");
  const seekFTiny = document.createElement("button");
  const subtitleLabel = document.createElement("label");
  const subtitleLabelIcon = document.createElement("i");
  const subtitle = document.createElement("input");

  pause.classList.add("button")
  seekBTiny.classList.add("button");
  seekFTiny.classList.add("button");

  pause.textContent = "▶";
  seekBTiny.textContent = "<";
  seekFTiny.textContent = ">";

  leaderControls.id = "leader-controls";
  pause.id = "pause";
  subtitle.id = "subtitle";
  videoInput.id = "video-input";

  //leaderControls styling
  leaderControls.style.display = "flex";
  leaderControls.style.alignItems = "center";

  //make the subtitle button look prettier
  subtitleLabel.style.color = "white";
  subtitleLabel.htmlFor = "subtitle";
  subtitleLabel.classList.add("file-upload");
  subtitleLabel.appendChild(subtitleLabelIcon);
  subtitleLabelIcon.classList.add("fa");
  subtitleLabelIcon.classList.add("fa-cloud-upload");
  subtitleLabel.innerHTML += " Subtitle";

  //set subtitle button to only accept vtt
  subtitle.type = "file";
  subtitle.accept = ".vtt";

  //pause click event
  pause.addEventListener("click", togglePause);

  //seeking the video
  seekBTiny.addEventListener("click", () => {
    socket.emit("seek", {time: -5000});
  })
  seekFTiny.addEventListener("click", () => {
    socket.emit("seek", {time: 5000});
  })

  subtitle.addEventListener("change", () => {
    if(subtitle.files[0]) {
      //create the streams
      const file = subtitle.files[0];
      const stream = ss.createStream();
      const blobstream = ss.createBlobReadStream(file);

      //pipe the blobstream to stream
      ss(socket).emit('subtitle', stream)
      blobstream.pipe(stream);

      subtitleLabel.classList.add("activated");
    } else {
      subtitleLabel.classList.remove("activated");
    }
  })

  videoInput.addEventListener("keydown", event => {
    //if enter key is pressed and videoInput is not blank then play the link
    if(event.code == "Enter" && videoInput.value.trim() != "")
      socket.emit("play-video", { link: videoInput.value });
  })

  leaderControls.appendChild(pause);
  leaderControls.appendChild(seekBTiny);
  leaderControls.appendChild(videoInput);
  leaderControls.appendChild(seekFTiny);
  leaderControls.appendChild(subtitle);
  leaderControls.appendChild(subtitleLabel);
  controlPanel.appendChild(leaderControls);

  //add keybinds
  window.addEventListener("keydown", leaderControlsKeydown);
}

function removeLeaderControls()
{
  //remove keybinds
  window.removeEventListener("keydown", leaderControlsKeydown);

  //remove leader control panel
  document.getElementById("leader-controls").remove();
}

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  //start update loop after 200 milliseconds
  setTimeout(update, 200);

  //reloads the subtitle when the player has changed videos
  player.addEventListener("loadedmetadata", reloadSubtitle);

  //set player default volume to 50%
  player.volume = 0.5;
});

