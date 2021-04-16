const YouTubePlayer = require("youtube-player");

class YouTube {
    constructor(video, socket) {
        this.type = "YouTube";
        this.socket = socket;
        this.isLivestream = video.isLivestream;
        this.playerElem = document.getElementById("player");
        this.playerContainer = document.createElement("div");
        this.playerElem.appendChild(this.playerContainer);
        this.playerContainer.id = "video-player";
        this.player = YouTubePlayer("video-player", {
            height: this.playerElem.clientHeight,
            width: this.playerElem.clientWidth,
        });
        this.player.loadVideoById(video.id);
        this.state = this.player.getPlayerState();
        this.paused = false;
        this.player.on("stateChange", (event) => {
            switch (event.data) {
                case -1:
                    break;
                case 0:
                    if (this.state == 1)
                        //client skipped and ended video
                        this.socket.emit("videoEnded");
                    break;
                case 1:
                    if (this.state == 2)
                        // Client unpaused video
                        this.paused = false;
                    break;
                case 2:
                    if (this.state == 1)
                        // Client paused video
                        this.paused = true;
                    break;
                case 3:
                    if (this.isLivestream == false && this.state == -1)
                        // Client who requested video got video loaded
                        this.socket.emit("sync", { currentTime: 0 });
                    break;
                case 5:
                    break;
            }
            this.state = event.data;
        });
    }
    isPaused() {
        return this.paused;
    }
    pause() {
        if(!this.paused)
            this.player.pauseVideo();
    }
    unpause() {
        if(this.paused)
            this.player.playVideo();
    }
    seekTo(time) {
        this.player.seekTo(time / 1000, true);
    }
    getCurrentTime() {
        return this.player.getCurrentTime();
    }
    resize() {
        this.player.setSize(
            this.playerElem.clientWidth,
            this.playerElem.clientHeight
        );
    }
    destroy() {
        this.player.destroy();
    }
}

module.exports = YouTube;
