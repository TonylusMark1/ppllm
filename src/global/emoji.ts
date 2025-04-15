const EmojisForExtensions: Record<string, string> = {
    "jpeg,jpg,png,bmp,gif": "🖼️",
    "csv,xlsx": "📊",
    "mp3,wav": "🎵",
    "mp4,avi": "🎬",
}

//

export const General = {
    Working: '🔧',
    FileStructure: '🌳',
    InnerPromptsHeader: '🧠',
    FileContents: '📚',
    Error: '❌',
    Success: '✅',
    Saved: '💾',
};

//

export const Files = {
    General: {
        AnyNonBinaryFile: "📄",
        AnyBinaryFile: "📦",
        EmptyFolder: "📁",
        Folder: "📂",
    },
    PerExt: Object.fromEntries(
        Object.entries(EmojisForExtensions)
            .map(entry => {
                const key = entry[0];
                const val = entry[1];
    
                const exts = key.split(/\s*[,;]\s*/g);
                return exts.map(ext => [ext, val]);
            })
            .flat()
    ),
};