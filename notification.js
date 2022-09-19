// const player = require('play-sound')(opts={})
// player.play('alarm.mp3', (err)=>{if(err)throw err})
const path = require("path");
const sound = require("sound-play");
const notification = ()=>{

    sound.play(path.join(__dirname, "audio.mp3"));
}

module.exports = notification