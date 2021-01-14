const Discord = require('discord.js');
const client = new Discord.Client();
const say = require('say');
require('dotenv').config();

var channel;

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', gotMessage);

client.on('messageReactionAdd', gotReaction);

client.login(process.env.DISCORD_KEY);

function gotMessage(msg) 
{
	if (message.author.id === client.user.id)
	{
		return;
	}
	//if (msg.content === 'Hello')
	{
		msg.reply('Hi 😔');
		sayIt(msg, msg.content)
	}
}

function gotReaction(reaction, user)
{
	reaction.message.reply('You reacted!');
}

function sayIt(message, text)
{
	// Checking if the message author is in a voice channel.
    if (!message.member.voice.channel) return message.reply("You must be in a voice channel.");
    // Checking if the bot is in a voice channel.
    if (message.guild.me.voice.channel) return message.reply("I'm already playing.");

    // Joining the channel and creating a VoiceConnection.
    message.member.voice.channel.join();
	
	saySomething(message.member.voice.channel, text);
}

function saySomething(voiceChannel, text)
{
    const timestamp = new Date().getTime();
    const soundPath = `./temp/${timestamp}.wav`;
    say.export(text, null, 1, soundPath, (err) => {
        if (err) {
            console.error(err);
            return;
        }else{
            voiceChannel.join().then((connection) => {
                connection.play(soundPath);
            }).catch((err) => {
                console.error(err);
            });
        }
    });
}