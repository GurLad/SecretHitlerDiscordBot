// const os = require("os"); // Comes with node.js
//console.log(os.type());

// https://nodejs.org/api/process.html#process_process_platform
// aix, darwin, freebsd, linux, openbsd, sunos, win32

// if (process.platform === "win32") {
//     console.log("Microsoft Windows");
// } else if (process.platform === "darwin") {
//     console.log("Apple Mac OS X");
// } else if (process.platform === "linux") {
//     console.log("Linux");
// }

var processPlatform = process.platform

switch (processPlatform) {
    case "win32":
        console.log("Microsoft Windows");
        break;
    case "darwin":
        console.log("Apple Mac OS X");
        break;
    case "linux":
        console.log("Linux");
        break;
    default:
        console.log("other environment: " + processPlatform);
        break;
}
