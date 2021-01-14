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
	if (msg.author.id === client.user.id)
	{
		return;
	}
	if (channel == null)
	{
		// Checking if the message author is in a voice channel.
		if (!msg.member.voice.channel) return msg.reply("You must be in a voice channel.");
		// Checking if the bot is in a voice channel.
		if (!msg.guild.me.voice.channel)
		{
			// Joining the channel and creating a VoiceConnection.
			msg.member.voice.channel.join();
		}
		channel = msg.guild.me.voice.channel;
	}
	msg.reply('Hi 😀');
	sayIt(msg, msg.content);
}

function gotReaction(reaction, user)
{
	reaction.message.reply('You reacted!');
}

function sayIt(message, text)
{
	
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