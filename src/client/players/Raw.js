class Raw {
    constructor(video, socket, videoManager) {
        this.type = "Raw";
        this.socket = socket;
        this.playerElem = document.getElementById("player");
        this.player = document.createElement("video");
        this.playerElem.appendChild(this.player);
        this.player.controls = true;
        this.player.autoplay = true
        this.player.setAttribute("height", this.playerElem.clientHeight);
        this.player.setAttribute("width", this.playerElem.clientWidth);
        this.player.id = "video-player";
        this.player.src = video.url;
        this.player.load();
        this.player.oncanplay = () => {
            this.player.play();
            this.player.onended = () => {
                this.socket.emit("videoEnded");
            }
            videoManager.updateRaw(video, this.player.duration);
        }
    }
    isPaused() {
        return this.player.paused;
    }
    pause() {
        if(!this.player.paused)
            this.player.pause();
    }
    unpause() {
        if(this.player.paused)
            this.player.play();
    }
    seekTo(time) {
        this.player.currentTime = time / 1000;
    }
    resize() {
        this.player.setAttribute("height", this.playerElem.clientHeight);
        this.player.setAttribute("width", this.playerElem.clientWidth);
    }
    destroy() {
        this.player.remove();
    }
    getCurrentTime()
    {
        return new Promise((resolve, _) => {
            resolve(this.player.currentTime);
        })
    }
}
module.exports = Raw;
