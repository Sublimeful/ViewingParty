import express    from "express";
import {Server}   from "socket.io";
import ss         from "socket.io-stream";
import ytdl       from "ytdl-core";
import path       from "path";
import fs         from "fs";

import * as tools from "./ServerTools.js";

const app  = express();
const port = process.env.PORT || 8000;

const httpServer = app.listen(port, () => {
  console.log("Server is listening on port " + port + "!");
});
const server     = new Server(httpServer);

var subtitlePath = "public/sub.vtt";
var clientList   = [];

var currentVideo = {
  link:    "",
  start: null,
  pause: null,
  time:  null,
}



server.on("connection", client => {
  //add client to clientList
  clientList.push(client);

  //client variables
  client.isLeader = false;

  client.on("toggle-leader", () => {
    //toggle leader for client
    if(client.isLeader) {
      client.isLeader = false;
      return;
    }

    if(!tools.isAnybodyLeader(clientList)) {
      client.isLeader = true;
      client.emit("leader");
      return;
    }

    // notify client if someone else is already a leader
    client.emit("notify", {message: "🏳️ Somebody else is already leader!"})
  })

  client.on("sync", data => {
    //time is in milliseconds
    const clientVideo = data.video;
    const clientTime  = data.video.time;
    const threshold   = data.threshold;

    //if video differs, then sync
    if(clientVideo.link != currentVideo.link) {
      client.emit("sync", {video: currentVideo});
      return;
    }

    //if the difference between server time and client time is
    //greater than threshold then sync client with server
    if(Math.abs(tools.getTime(currentVideo) - clientTime) > threshold) {
      client.emit("sync", {video: currentVideo});
      return;
    }
  })

  ss(client).on('subtitle', stream => {
    if(!client.isLeader)
      return;

    //write the subtitle data to subtitlePath
    stream.pipe(fs.createWriteStream(subtitlePath));

    //when piping finishes reload subtitle for every client
    stream.on('finish', () => {
      server.emit("reload-subtitle");
    })
  })

  client.on("toggle-pause", () => {
    if(!client.isLeader)
      return;

    //tools.togglePauseVideo will calibrate video.time automatically
    tools.togglePauseVideo(currentVideo);

    //then we sync the user up!
    server.emit("sync", {video: currentVideo});
  })

  client.on("seek", data => {
    if(!client.isLeader)
      return;

    if(!isNaN(data.duration) && tools.getTime(currentVideo) >= data.duration) {
      //if currentVideo time is over duration of video, then seek using duration
      tools.setVideoTime(currentVideo, data.duration + data.time);
    } else {
      //tools.seekVideo will calibrate video.time automatically
      tools.seekVideo(currentVideo, data.time);
    }

    //then we sync the user up!
    server.emit("sync", {video: currentVideo});
  })

  client.on("set-time", data => {
    if(!client.isLeader)
      return;

    //tools.setVideoTime will calibrate video.time automatically
    tools.setVideoTime(currentVideo, data.time);

    //then we sync the user up!
    server.emit("sync", {video: currentVideo});
  })

  client.on("play-video", async data => {
    if(!client.isLeader)
      return;

    try {
      //checks if the link is a youtube link
      //if it is, then use ytdl to get and play the raw link
      let info = await ytdl.getInfo(data.link);
      let formats = ytdl.filterFormats(info.formats, 'videoandaudio');

      tools.playVideo(currentVideo, formats[formats.length - 1].url);
    } catch(err) {
      //if not youtube link, then just play the link as is
      tools.playVideo(currentVideo, data.link);
    }

    //then we sync the user up!
    server.emit("sync", {video: currentVideo});
  })

  client.on("disconnect", () => {
    //client disconnects from the site, remove client from clientList
    clientList.splice(clientList.indexOf(client), 1);
  })
});



app.get("/", function (req, res) {
  res.sendFile("public/index.html", {root: path.dirname(".")});
});

app.use(express.static("public"));

