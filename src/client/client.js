const io = require("socket.io-client");
const ss = require('socket.io-stream');
const socket = io();

const leaderBtn = document.getElementById("leader-btn")
const controlPanel = document.getElementById("control-panel")
const player = document.getElementById("video-player")

var currentVideo = {
  link: null,
  time: null,
}

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

socket.on("switch-subtitle", () => {
  //if there is a new subtitle, then reload the subtitle
  if(document.getElementById("track")) {
    document.getElementById("track").remove();
  }
  const track = document.createElement("track");
  track.kind = "captions";
  track.label = "English";
  track.srclang = "en";
  track.src = "/sub.vtt";
  track.id = "track";
  track.mode = "showing";
  track.default = true;
  player.appendChild(track);
})

function sync(video)
{
  const videoLink = video.link;
  const videoTime = video.time;

  if(player.src != videoLink) {
    currentVideo.link = videoLink;
    player.src = videoLink;
    player.pause();
    player.currentTime = 0;
    player.play();
  }

  //if video's pause state is not equal to player's paused state
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

  //pause the video accordingly
  if(paused != player.paused) {
    if(paused)
      player.pause();
    else
      player.play();
  }

  //convert milliseconds to seconds
  player.currentTime = videoTime / 1000;
}

function update()
{
  currentVideo.time = player.currentTime;
  socket.emit("sync", {video: currentVideo});
  setTimeout(update, 500);
}

function addLeaderControls()
{
  const leaderControls = document.createElement("section");
  const seekBack = document.createElement("button");
  const videoInput = document.createElement("input");
  const seekForward = document.createElement("button");
  const pause = document.createElement("button");
  const subtitleLabel = document.createElement("label");
  const subtitleLabelIcon = document.createElement("i");
  const subtitle = document.createElement("input");

  seekBack.classList.add("button");
  seekForward.classList.add("button");
  pause.classList.add("button")
  seekBack.textContent = "<";
  seekForward.textContent = ">";
  pause.textContent = "▶";

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

  seekBack.addEventListener("click", () => {
    socket.emit("seek", {time: -5000});
  })

  seekForward.addEventListener("click", () => {
    socket.emit("seek", {time: 5000});
  })

  //toggle pause button activation when pressed
  pause.addEventListener("click", () => {
    socket.emit("toggle-pause");
    if(pause.classList.contains("activated")) {
      pause.classList.remove("activated");
      pause.textContent = "▶";
    } else {
      pause.classList.add("activated");
      pause.textContent = "⏸";
    }
  })

  //if a file is uploaded to subtitle, then activate subtitle label
  subtitle.onchange = () => {
    if(subtitle.files[0]) {
      subtitleLabel.classList.add("activated");
    } else {
      subtitleLabel.classList.remove("activated");
    }
  }

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

  leaderControls.id = "leader-controls";
  leaderControls.style.display = "flex";

  pause.id = "pause";
  seekBack.id = "seek-back";
  seekForward.id = "seek-forward";
  videoInput.id = "video-input";
  subtitle.id = "subtitle";

  leaderControls.appendChild(seekBack);
  leaderControls.appendChild(videoInput);
  leaderControls.appendChild(seekForward);
  leaderControls.appendChild(pause);
  leaderControls.appendChild(subtitle);
  leaderControls.appendChild(subtitleLabel);
  controlPanel.appendChild(leaderControls);
}

function removeLeaderControls()
{
  document.getElementById("leader-controls").remove();
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(update, 200);
});

