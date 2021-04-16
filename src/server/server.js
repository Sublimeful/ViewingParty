import express from "express";
import { Server } from "socket.io";
import path from "path";

import * as tools from "./ServerTools.js";

const app = express();
const port = process.env.PORT || 3000;

const httpServer = app.listen(port, () => {
  console.log("server is listening on port " + port + "!");
});
const server = new Server(httpServer);

var clientList = [];
var currentVideo = {
  link: "",
  start: null,
  pause: null,
  time: null,
}

server.on("connection", (client) => {
  //add client to list
  clientList.push(client);

  //client vars
  client.isSignedIn = false;
  client.isLeader = false;

  //load the current video for client

  //client toggles leader button
  client.on("toggle-leader", () => {
    if(client.isLeader) {
      client.isLeader = false;
      client.emit("unleader");
    } else if(!tools.isAnybodyLeader(clientList)) {
      client.isLeader = true;
      client.emit("leader");
    }
  })

  //syncs a client
  client.on("sync", data => {
    //time is in milliseconds
    const clientVideo = data.video;
    const clientTime = data.video.time * 1000; //convert to milliseconds

    //if video differs, then sync
    if(clientVideo.link != currentVideo.link) {
      client.emit("sync", {video: currentVideo});
    }

    //set video.time to getTime and return getTime
    if(Math.abs((currentVideo.time = tools.getTime(currentVideo)) - clientTime) >= 2000) {
      console.log(Math.abs((tools.getTime(currentVideo)) - clientTime))
      client.emit("sync", {video: currentVideo});
    }
  })

  //client syncs
  client.on("seek", data => {
    if(!client.isLeader) return;
    tools.seekVideo(currentVideo, data.time);
  })

  //client plays a link
  client.on("play-video", data => {
    const videoLink = data.link;
    if(tools.videoVerifier(videoLink)) {
      tools.playVideo(currentVideo, videoLink);
    }
  })

  //client exits
  client.on("disconnect", () => {
    clientList.splice(clientList.indexOf(client), 1);
  })

});

app.get("/", function (req, res) {
  res.sendFile("public/index.html", { root: path.dirname(".") });
});

app.use(express.static("public"));

