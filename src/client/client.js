const io = require("socket.io-client");
const ss = require('socket.io-stream');
const socket = io();

const leaderBtn = document.getElementById("leader-btn")
const controlPanel = document.getElementById("control-panel")
const player = document.getElementById("video-player")
const progressBar = document.getElementById("progress-bar")
const audioBtn = document.getElementById("audio")
const volumeSlider = document.getElementById("volume")

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

function reloadSubtitles()
{
  //if there is a track element then remove that element
  if(document.getElementById("track")) {
    document.getElementById("track").remove();
  }

  //checks to see if there is a new subtitle, if not, then continue checking
  fetch("/sub.vtt").then(res => {
    if(!res.ok) {
      throw new Error("Not 2xx response");
    } else {
      //if there is a new subtitle, then reload the subtitle
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
  }).catch(() => {
    //check after 500 milliseconds
    setTimeout(reloadSubtitles, 500);
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
  //if videoInput is focused, then dont react to keys
  const videoInput = document.getElementById("video-input");
  if(document.activeElement == videoInput) return;

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

  //if a file is uploaded to subtitle, then activate subtitle label
  subtitle.onchange = () => {
    if(subtitle.files[0]) {
      subtitleLabel.classList.add("activated");
    } else {
      subtitleLabel.classList.remove("activated");
    }
  }

  //video input event
  videoInput.addEventListener("keydown", event => {
    if (event.code == "Enter") {
      event.preventDefault();
      if (videoInput.value.trim() != "") {
        //play the video
        socket.emit("play-video", { link: videoInput.value });

        //if there is subtitle, then use it
        if(subtitle.files[0])
        {
          const file = subtitle.files[0];

          //create the streams
          const stream = ss.createStream();
          const blobstream = ss.createBlobReadStream(file);

          //pipe the blobstream to stream
          ss(socket).emit('subtitle', stream)
          blobstream.pipe(stream);
        }
      }
    }
  })

  leaderControls.appendChild(pause);
  leaderControls.appendChild(seekBTiny);
  leaderControls.appendChild(videoInput);
  leaderControls.appendChild(seekFTiny);
  leaderControls.appendChild(subtitle);
  leaderControls.appendChild(subtitleLabel);
  controlPanel.appendChild(leaderControls);

  //add keybinds
  document.addEventListener("keydown", leaderControlsKeydown);
}

function removeLeaderControls()
{
  //remove keybinds
  document.removeEventListener("keydown", leaderControlsKeydown);

  //remove leader control panel
  document.getElementById("leader-controls").remove();
}

document.addEventListener('DOMContentLoaded', () => {
  //start update loop after 200 milliseconds
  setTimeout(update, 200);

  //reload the subtitles each time a video starts playing
  player.oncanplay = reloadSubtitles;

  //set player default volume to 50%
  player.volume = 0.5;
});

