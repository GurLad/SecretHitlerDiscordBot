// const os = require("os"); // Comes with node.js
//console.log(os.type());

// https://nodejs.org/api/process.html#process_process_platform
// aix, darwin, freebsd, linux, openbsd, sunos, win32

if (process.platform === "win32") {
    console.log("Microsoft Windows");
} else if (process.platform === "darwin") {
    console.log("Apple Mac OS X");
} else if (process.platform === "linux") {
    console.log("Linux");
}
