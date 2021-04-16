
import fetch from "node-fetch";
class Raw
{
    constructor(url, contentType) {
        this.type = "Raw";
        this.contentType = contentType;
        this.url = url;
        this.title = null;
    }
    static requestVideoData(url)
    {
        return new Promise((resolve, reject) => {
            fetch(url)
            .then((res) => {
                const contentType = res.headers.get("Content-Type");
                resolve(new Raw(url, contentType));
            })
            .catch((error) => reject(error))
        })
    }
}
export default Raw;