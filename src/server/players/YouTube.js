import fetch from "node-fetch";
class YouTube {
    constructor(id, title, duration) {
        this.type = "YouTube";
        this.id = id;
        this.title = title;
        this.duration = duration;
        this.isLivestream = false;
    }
    static getVideoId(url, type) {
        const matchVideo = /(?<=^(https?\:\/\/)?(www.)?(youtube\.com\/watch\?v=|youtube\.com\/|youtu\.be\/))[A-z0-9_-]{11}/;
        const matchPlaylist = /youtube\.com.*list=([A-z0-9_-]+)/;
        switch (type) {
            case "Video":
                return url.match(matchVideo)[0];
            case "Playlist":
                return url.match(matchPlaylist)[1];
        }
    }
    static requestVideoData(url, id) {
        if (id == null) id = YouTube.getVideoId(url, "Video");
        const apiKey = "AIzaSyDTk1OPRI9cDkAK_BKsBcv10DQCHse-QaA";
        const fetchUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&fields=items(snippet/title,contentDetails/duration)&id=${id}&key=${apiKey}`;
        return new Promise(function (resolve, reject) {
            fetch(fetchUrl)
                .then((res) => res.json())
                .then((json) => {
                    if (json.items[0] == null) return;
                    const item = json.items[0];
                    var matchHours = /([0-9]+)H/;
                    var matchMinutes = /([0-9]+)M/;
                    var matchSeconds = /([0-9]+)S/;
                    matchHours = item.contentDetails.duration.match(matchHours);
                    matchMinutes = item.contentDetails.duration.match(
                        matchMinutes
                    );
                    matchSeconds = item.contentDetails.duration.match(
                        matchSeconds
                    );
                    const hours =
                        matchHours == null ? 0 : parseInt(matchHours[1]);
                    const minutes =
                        matchMinutes == null ? 0 : parseInt(matchMinutes[1]);
                    const seconds =
                        matchSeconds == null ? 0 : parseInt(matchSeconds[1]);
                    const duration =
                        seconds * 1000 +
                        minutes * 60 * 1000 +
                        hours * 60 * 60 * 1000;
                    var ret = new YouTube(id, item.snippet.title, duration);
                    if (duration == 0) ret.isLivestream = true;
                    resolve(ret);
                })
                .catch((err) => reject(err));
        });
    }
    static enqueuePlaylist(url, maxResults, videoManager) {
        const id = YouTube.getVideoId(url, "Playlist");
        const apiKey = "AIzaSyDTk1OPRI9cDkAK_BKsBcv10DQCHse-QaA";
        const fetchUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&fields=nextPageToken,items(snippet/resourceId/videoId)&playlistId=${id}&key=${apiKey}`;
        const executor = async () => {
            var json = await new Promise((resolve, _) => {
                fetch(fetchUrl)
                    .then((res) => resolve(res.json()))
                    .catch((err) => console.error(err));
            });
            if (json.items == null) return;
            for (var i = 0; i < json.items.length; ++i) {
                if (maxResults-- == 0) return;
                const item = json.items[i];
                const id = item.snippet.resourceId.videoId;
                videoManager.enqueue(await this.requestVideoData(null, id));
            }
            while (json.nextPageToken != null) {
                json = await new Promise((resolve, _) => {
                    fetch(fetchUrl + "&pageToken=" + json.nextPageToken)
                        .then((res) => resolve(res.json()))
                        .catch((err) => console.error(err));
                });
                for (var i = 0; i < json.items.length; ++i) {
                    if (maxResults-- == 0) return;
                    const item = json.items[i];
                    const id = item.snippet.resourceId.videoId;
                    videoManager.enqueue(await this.requestVideoData(null, id));
                }
            }
        };
        executor();
    }
}
export default YouTube;
