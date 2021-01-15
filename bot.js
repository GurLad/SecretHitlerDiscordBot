const Discord = require('discord.js');
const client = new Discord.Client();
const say = require('say');
require('dotenv').config();

var channel;
var guild;
var players = [];
var voice = null;
var voicePrefix = "Microsoft ";
var voiceSuffix = " Desktop";
var prefix = "!";

var voices = [ "David", "Hazel", "Zira" ];



client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', gotMessage);

client.on('messageReactionAdd', gotReaction);

client.login(process.env.DISCORD_KEY);

function gotMessage(message)
{
	if (message.author.id === client.user.id)
	{
		return;
	}
	if (channel == null)
	{
		// Checking if the message author is in a voice channel.
		if (!message.member.voice.channel) return message.reply("You must be in a voice channel.");
		// Checking if the bot is in a voice channel.
		if (!message.guild.me.voice.channel)
		{
			// Joining the channel and creating a VoiceConnection.
			message.member.voice.channel.join();
		}
		channel = message.guild.me.voice.channel;
		guild = message.guild;
	}
	var member = guild.member(message.author);
	// Commands
	if (message.content.startsWith(prefix))
	{
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const command = args.shift().toLowerCase();
		switch (command) {
			case 'say':
				saySomething(member.displayName + " said " + args.join(' '));
				break;
			case 'setVoice':
				var input = args[0];
				if (voices.includes(input))
				{
					voice = voicePrefix + input + voiceSuffix;
					saySomething("Hello there! I'm your new narrator!");
				}
				else
				{
					message.reply('Invalid voice!');
				}
				break;
			case 'listVoices':
				message.reply(voices.join());
				break;
			default:
				break;
		}
	}
	else // Game actions
	{
		if (!players.includes(member))
		{
			players.push(member);
			message.reply('Hi 😀\nThere are ' + players.length + ' players.');
			saySomething(member.displayName + " joined the game!");
		}
		else
		{
			message.reply("You're already in the game!")
		}
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
    say.export(text, voice, 1, soundPath, (err) => {
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
