const Emojis: Record<string, string> = {
    "jpeg,jpg,png,bmp,gif": "🖼️",
    "csv,xlsx": "📊",
    //"js,ts,py,java,c,cpp,h,html,css,json,xml": "📜",
    "mp3,wav": "🎵",
    "mp4,avi": "🎬",
}

//

export const anyNonBinaryFile = "📄";
export const anyBinaryFile = "📦";
export const emptyFolder = "📁";
export const folder = "📂";

export const specific = Object.fromEntries(
    Object.entries(Emojis)
        .map(entry => {
            const key = entry[0];
            const val = entry[1];

            const exts = key.split(/\s*[,;]\s*/g);
            return exts.map(ext => [ext, val]);
        })
        .flat()
);