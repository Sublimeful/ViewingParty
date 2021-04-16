import express from "express";
import { Server } from "socket.io";
import ss from "socket.io-stream";
import path from "path";
import fs from "fs";

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

  ss(client).on('subtitle', (stream, data) => {
    //when client uploads subtitle

    //write the subtitle data to public/sub.vtt
    const filename = "public/sub.vtt";
    stream.pipe(fs.createWriteStream(filename));

    //emit a request to switch subtitle
    server.emit("switch-subtitle");
  })

  client.on("toggle-leader", () => {
    //when client toggles the leader button
    if(client.isLeader) {
      client.isLeader = false;
      client.emit("unleader");
    } else if(!tools.isAnybodyLeader(clientList)) {
      client.isLeader = true;
      client.emit("leader");
    }
  })

  client.on("sync", data => {
    //when client syncs up

    //time is in milliseconds
    const clientVideo = data.video;

    //convert client's video time to milliseconds
    const clientTime = data.video.time * 1000;

    //if video differs, then sync
    if(clientVideo.link != currentVideo.link) {
      client.emit("sync", {video: currentVideo});
    }

    //set video.time to getTime and return getTime
    if(Math.abs(tools.getTime(currentVideo) - clientTime) >= 1000) {
      client.emit("sync", {video: currentVideo});
    }
  })

  client.on("toggle-pause", () => {
    //when client toggles pause
    if(!client.isLeader) return;

    tools.togglePauseVideo(currentVideo);

    //tools.getTime calibrates video.time
    tools.getTime(currentVideo);

    //then we sync the user up!
    server.emit("sync", {video: currentVideo});
  })

  client.on("seek", data => {
    //when client seeks
    if(!client.isLeader) return;

    //tools.seekVideo will calibrate video.time automatically
    tools.seekVideo(currentVideo, data.time);

    //then we sync the user up!
    server.emit("sync", {video: currentVideo});
  })

  client.on("play-video", data => {
    //when client plays a link
    tools.playVideo(currentVideo, data.link);
  })

  client.on("disconnect", () => {
    //when client exits
    clientList.splice(clientList.indexOf(client), 1);
  })
});

app.get("/", function (req, res) {
  res.sendFile("public/index.html", { root: path.dirname(".") });
});

app.use(express.static("public"));

