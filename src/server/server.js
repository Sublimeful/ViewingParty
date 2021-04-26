import express from "express";
import { Server } from "socket.io";
import ss from "socket.io-stream";
import ytdl from "ytdl-core";
import path from "path";
import fs from "fs";

import * as tools from "./ServerTools.js";

const app = express();
const port = process.env.PORT || 8080;

const httpServer = app.listen(port, () => {
  console.log("server is listening on port " + port + "!");
});
const server = new Server(httpServer);

var subtitlePath = "public/sub.vtt";
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

  ss(client).on('subtitle', stream => {
    //when client uploads subtitle

    //if sub.vtt exists
    if (fs.existsSync(subtitlePath)) {
      //remove the sub.vtt file
      fs.unlinkSync(subtitlePath);
    }

    //write the subtitle data to public/sub.vtt
    stream.pipe(fs.createWriteStream(subtitlePath));
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
    const clientTime = data.video.time;

    //if video differs, then sync
    if(clientVideo.link != currentVideo.link) {
      client.emit("sync", {video: currentVideo, time: Date.now()});
    }

    //if the difference between client time and server time
    //is greater than 200 milliseconds then sync client with server
    if(Math.abs(tools.getTime(currentVideo) - clientTime) > 200) {
      client.emit("sync", {video: currentVideo, time: Date.now()});
    }
    console.log(currentVideo.time);
  })

  client.on("toggle-pause", () => {
    //when client toggles pause
    if(!client.isLeader) return;

    //tools.togglePauseVideo will calibrate video.time automatically
    tools.togglePauseVideo(currentVideo);

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

  client.on("play-video", async data => {
    try {
      let info = await ytdl.getInfo(data.link);
      let formats = ytdl.filterFormats(info.formats, 'videoandaudio');
      tools.playVideo(currentVideo, formats[formats.length - 1].url);
    } catch {
      //if youtube url is invalid or does not exist
      tools.playVideo(currentVideo, data.link);
    }
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

