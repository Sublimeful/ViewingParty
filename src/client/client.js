const io = require("socket.io-client");
const ss = require('socket.io-stream');
const client = io();

const leaderBtn =      document.getElementById("leader-btn");
const controlPanel =   document.getElementById("control-panel");
const player =         document.getElementById("video-player");
const progressBar =    document.getElementById("progress-bar");
const audioBtn =       document.getElementById("audio");
const volumeSlider =   document.getElementById("volume");
const thresholdInput = document.getElementById("threshold");

var threshold = 400;
var currentVideo = {
  link: "",
  time: null,
  paused: false
}



volumeSlider.addEventListener("input", () => {
  //unmute and set the volume
  player.muted = false;
  player.volume = volumeSlider.value / 100;

  //change the look of audioBtn to look activated
  audioBtn.classList.add("activated");
})

audioBtn.addEventListener("click", () => {
  //toggle player muted state
  player.muted = !player.muted;

  //change autoBtn class based on muted state
  if(!player.muted)
    audioBtn.classList.add("activated");
  else
    audioBtn.classList.remove("activated");
})

thresholdInput.addEventListener("change", () => {
  //get threshold from input
  threshold = parseInt(thresholdInput.value);

  //if input value is not a number or if threshold is negative, then default to 400
  if(isNaN(threshold) || threshold < 0)
    threshold = 400;
})

leaderBtn.addEventListener("click", () => {
  //on click of the leaderBtn, toggle leader
  client.emit("toggle-leader");
});

client.on("leader", () => {
  //when client becomes leader, activate leaderBtn and addLeaderControls
  leaderBtn.classList.add("activated");
  addLeaderControls();
})

client.on("unleader", () => {
  //when client loses leader, deactivate leaderBtn and removeLeaderControls
  leaderBtn.classList.remove("activated");
  removeLeaderControls();
})

client.on("sync", data => {sync(data.video)});

client.on("reload-subtitle", reloadSubtitle);



function reloadSubtitle()
{
  fetch("/sub.vtt").then(res => {
    //if there is subtitle, then reload the subtitle
    if(res.ok) {
      //remove the current track element
      document.getElementById("track").remove();

      //create new track element and append it to player
      const track = document.createElement("track");
      track.id = "track";
      track.kind = "captions";
      track.src = "/sub.vtt";
      track.mode = "showing";
      track.default = true;
      player.appendChild(track);
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
  if(player.src != video.link) {
    player.src = video.link;
    currentVideo.link = video.link;
  }

  //set the client videoTime to server videoTime
  player.currentTime = video.time / 1000;
  currentVideo.time = video.time;

  //set the currentVideo pause state
  currentVideo.paused = paused;

  //if video.time is greater than or equal to the player duration then return
  if(video.time >= player.duration * 1000)
    return;

  //pause the video accordingly
  if(paused != player.paused) {
    if(paused) {
      player.pause();
    } else {
      const playPromise = player.play();

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
  currentVideo.time = player.currentTime * 1000;

  //send a sync emit
  client.emit("sync", {video: currentVideo, threshold: threshold});

  //update after 200 milliseconds
  setTimeout(update, 200);

  //dont divide by 0 or by NaN
  if(!player.duration)
    return;

  //update progress bar, change bar color based on whether video is paused
  const bar = progressBar.children[0];
  const progress = player.currentTime / player.duration;

  bar.style.width = progress * 100 + "%";
  if(!currentVideo.paused)
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

  //if user presses a number
  if(event.code.includes("Digit")) {
    const num = parseInt(event.code[event.code.length - 1]);
    const time = num / 10 * player.duration * 1000;

    //set video time if time is a number
    if(!isNaN(time))
      client.emit("set-time", {time: time});
  }

  //compare keycode and act on key that is pressed
  switch(event.code)
  {
    case "Space":
      client.emit("toggle-pause");
      break;
    case "KeyP":
      client.emit("toggle-pause");
      break;
    case "KeyH":
      client.emit("seek", {time: -60000, duration: player.duration * 1000});
      break;
    case "KeyJ":
      client.emit("seek", {time: -10000, duration: player.duration * 1000});
      break;
    case "KeyK":
      client.emit("seek", {time: 10000,  duration: player.duration * 1000});
      break;
    case "KeyL":
      client.emit("seek", {time: 60000,  duration: player.duration * 1000});
      break;
    case "ArrowLeft":
      client.emit("seek", {time: -5000,  duration: player.duration * 1000});
      break;
    case "ArrowRight":
      client.emit("seek", {time: 5000,   duration: player.duration * 1000});
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
  const leaderControls =    document.createElement("section");
  const pause =             document.createElement("button");
  const seekBTiny =         document.createElement("button");
  const videoInput =        document.createElement("input");
  const seekFTiny =         document.createElement("button");
  const subtitleLabel =     document.createElement("label");
  const subtitleLabelIcon = document.createElement("i");
  const subtitle =          document.createElement("input");

  pause.classList.add("button")
  seekBTiny.classList.add("button");
  seekFTiny.classList.add("button");

  seekBTiny.textContent = "<";
  seekFTiny.textContent = ">";

  leaderControls.id = "leader-controls";
  pause.id = "pause";
  subtitle.id = "subtitle";
  videoInput.id = "video-input";

  //pause button styling
  if(currentVideo.paused) {
    pause.classList.add("activated");
    pause.textContent = "⏸";
  } else {
    pause.classList.remove("activated");
    pause.textContent = "▶";
  }

  //leaderControls styling
  leaderControls.style.display = "flex";
  leaderControls.style.alignItems = "center";

  //make the subtitle button look prettier
  subtitleLabel.style.color = "white";
  subtitleLabel.style.minWidth = "102.5px";
  subtitleLabel.htmlFor = "subtitle";
  subtitleLabel.classList.add("file-upload");
  subtitleLabel.appendChild(subtitleLabelIcon);
  subtitleLabelIcon.classList.add("fa");
  subtitleLabelIcon.classList.add("fa-cloud-upload");
  subtitleLabel.innerHTML += " Subtitle";

  //set subtitle button to only accept vtt
  subtitle.type = "file";
  subtitle.accept = ".vtt";

  //videoInput styling
  videoInput.classList.add("input");
  videoInput.type = "text";
  videoInput.style.minWidth = "5rem";
  videoInput.placeholder = "Video links go here...";

  //pause click event
  pause.addEventListener("click", () => {
    client.emit("toggle-pause");
  });

  //seeking the video
  seekBTiny.addEventListener("click", () => {
    client.emit("seek", {time: -5000, duration: player.duration * 1000});
  })
  seekFTiny.addEventListener("click", () => {
    client.emit("seek", {time: 5000,  duration: player.duration * 1000});
  })

  subtitle.addEventListener("change", () => {
    if(subtitle.files[0]) {
      //activate the subtitleLabel
      subtitleLabel.classList.add("activated");

      //create the streams
      const file = subtitle.files[0];
      const stream = ss.createStream();
      const blobstream = ss.createBlobReadStream(file);

      //pipe the blobstream to stream
      ss(client).emit('subtitle', stream)
      blobstream.pipe(stream);
    } else {
      //deactivate the subtitleLabel
      subtitleLabel.classList.remove("activated");
    }
  })

  videoInput.addEventListener("keydown", event => {
    //if enter key is pressed and videoInput is not blank then play the link
    if(event.code == "Enter" && videoInput.value.trim() != "")
      client.emit("play-video", {link: videoInput.value});
  })

  leaderControls.appendChild(pause);
  leaderControls.appendChild(seekBTiny);
  leaderControls.appendChild(videoInput);
  leaderControls.appendChild(seekFTiny);
  leaderControls.appendChild(subtitle);
  leaderControls.appendChild(subtitleLabel);
  controlPanel.appendChild(leaderControls);

  //add the leaderControls keybinds
  window.addEventListener("keydown", leaderControlsKeydown);
}

function removeLeaderControls()
{
  //remove the leaderControls element
  document.getElementById("leader-controls").remove();

  //remove the leaderControls keybinds
  window.removeEventListener("keydown", leaderControlsKeydown);
}

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  //set player default volume to 50%
  player.volume = 0.5;

  //reloads the subtitle when the player has changed videos
  player.addEventListener("loadedmetadata", reloadSubtitle);

  //start update loop after 200 milliseconds
  setTimeout(update, 200);
});

