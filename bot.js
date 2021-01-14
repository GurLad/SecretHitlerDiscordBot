const Discord = require('discord.js');
const client = new Discord.Client();
const say = require('say');
require('dotenv').config();

var channel;
var guild;
var players = [];

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
		guild = msg.guild;
	}
	var member = guild.member(msg.author);
	if (msg.content.includes('!say'))
	{
		saySomething(member.displayName + " said " + msg.content.replace('!say', ''));
		return;
	}
	if (!players.includes(member))
	{
		players.push(member);
		msg.reply('Hi 😀\nThere are ' + players.length + ' players.');
		saySomething(member.displayName + " joined the game!");
	}
	else
	{
		msg.reply("You're already in the game!")
	}
}

function gotReaction(reaction, user)
{
	reaction.message.reply('You reacted!');
}

function saySomething(text)
{
    const timestamp = new Date().getTime();
    const soundPath = `./temp/${timestamp}.wav`;
    say.export(text, null, 1, soundPath, (err) => {
        if (err) {
            console.error(err);
            return;
        }else{
            channel.join().then((connection) => {
                connection.play(soundPath);
            }).catch((err) => {
                console.error(err);
            });
        }
    });
}