const connect = require("socket.io-client");
const socket = connect();

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

function sync(video)
{
  const videoLink = video.link;
  const videoTime = video.time;

  if(player.src != videoLink) {
    currentVideo.link = videoLink;
    player.src = videoLink;
    video.pause();
    video.currentTime = 0;
    player.play();
  }

  //if video's pause state is not equal to player's paused state
  const paused = (video.pause != null);
  if(paused != player.paused) {
    if(paused)
      player.pause();
    else
      player.play();
  }

  player.currentTime = videoTime / 1000; //convert milliseconds to seconds
}

function update()
{
  currentVideo.time = player.currentTime;
  socket.emit("sync", {video: currentVideo});
  setTimeout(update, 500);
}

function addLeaderControls()
{
  
    //<button class="button" id="leader-btn">⚑</button>
  const leaderControls = document.createElement("section");
  const seekBack = document.createElement("button");
  const videoInput = document.createElement("input");
  const seekForward = document.createElement("button");
  const pause = document.createElement("button");

  seekBack.classList.add("button");
  seekForward.classList.add("button");
  pause.classList.add("button")
  seekBack.textContent = "<";
  seekForward.textContent = ">";
  pause.textContent = "▶";

  seekBack.addEventListener("click", () => {
    socket.emit("seek", {time: -5000});
  })

  seekForward.addEventListener("click", () => {
    socket.emit("seek", {time: 5000});
  })

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

  videoInput.addEventListener("keydown", event => {
    if (event.code == "Enter") {
        event.preventDefault();
        if (videoInput.value.trim() != "") {
            socket.emit("play-video", { link: videoInput.value });
            videoInput.value = "";
        }
    }
  })

  leaderControls.id = "leader-controls";
  leaderControls.style.display = "flex";

  leaderControls.appendChild(seekBack);
  leaderControls.appendChild(videoInput);
  leaderControls.appendChild(seekForward);
  leaderControls.appendChild(pause);
  controlPanel.appendChild(leaderControls);
}

function removeLeaderControls()
{
  document.getElementById("leader-controls").remove();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(update, 200);
});

