const Discord = require('discord.js');
const client = new Discord.Client();
const say = require('say');
require('dotenv').config();

GameState = {
	INIT: 1,
	NOMINATE_CHANCELLOR: 2,
	PLAYER_VOTE: 3,
	PRESIDENT_DISCARD: 4,
	CHANCELLOR_DISCARD: 5,
	KILL: 6
}


var channelVoice;
var channelText;
var guild;
var connection;

var voice = null;
var voicePrefix = "Microsoft ";
var voiceSuffix = " Desktop";
var prefix = "!";

var voices = [ "David", "Hazel", "Zira" ];

var players = [];
var hitlerID = -1;
var facistsIDs = [];
var numLiberal = 0;
var numFacist = 0;
var currentState = GameState.INIT;



client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', gotMessage);

client.on('messageReactionAdd', gotReaction);

client.login(process.env.DISCORD_KEY);

async function gotMessage(message)
{
	if (message.author.id === client.user.id)
	{
		return;
	}
	if (channelVoice == null)
	{
		// Checking if the message author is in a voice channel.
		if (!message.member.voice.channel) return message.reply("You must be in a voice channel.");
		// Checking if the bot is in a voice channel.
		if (!message.guild.me.voice.channel)
		{
			// Joining the channel and creating a VoiceConnection.
			await message.member.voice.channel.join();
		}
		channelVoice = message.guild.me.voice.channel;
		connection = await channelVoice.join();
		guild = message.guild;
		channelText = message.channel;
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
			case 'start':
				if (currentState = GameState.INIT)
				{
					playersWithoutRoles = players.slice();
					hitlerID = getRandomInt(players.length);
					playersWithoutRoles.splice(hitlerID, 1);
					var numFacists = (players.length - 1) / 2 - 1;
					for (var i = 0; i < numFacists; i++)
					{
						var newID = getRandomInt(playersWithoutRoles.length);
						facistsIDs.push(players.indexOf(playersWithoutRoles[newID]));
						playersWithoutRoles.splice(newID, 1);
					}
					// console.log("Hitler is " + players[hitlerID].displayName + ", facists IDs are " + facistsIDs.join(', '));
					if (facistsIDs.length != 1)
					{
						players[hitlerID].send("You are Hitler, " + players[hitlerID].displayName + "!");
					}
					else
					{
						players[hitlerID].send("You are Hitler, " + players[hitlerID].displayName + "!\n The facist is " + players[facistsIDs[0]].displayName);
					}
					for (var i = 0; i < facistsIDs.length; i++)
					{
						var current = players[facistsIDs[i]];
						var toSend = "You are a Facist, " + current.displayName + "!\n Hitler is " + players[hitlerID].displayName;
						if (facistsIDs.length > 1)
						{
							toSend += ", and the other facists are ";
							var others = players.filter((a, b) => facistsIDs.indexOf(b) >= 0).splice(i, 1);
							for (var j = 0; j < others.length; j++) {
								toSend += others[j].displayName + ", ";
							}
						}
						current.send(toSend);
					}
					for (var i = 0; i < playersWithoutRoles.length; i++) {
						playersWithoutRoles[i].send("You are a Liberal, " + playersWithoutRoles[i].displayName);
					}

				}
				else
				{
					message.reply('Game in progress!');
				}
				break;
			case "end":
				var toSend = 'The players were: \n'
				for(var i = 0; i < players.length; i++) {
					toSend += players[i].displayName + ", a ";
					if (i == hitlerID)
					{
						toSend += "Hitler\n";
					}
					else if (facistsIDs.indexOf(i) >= 0)
					{
						toSend += "Facist\n";
					}
					else
					{
						toSend += "Liberal\n";
					}
				}
				message.reply(toSend);
				saySomething("Goodbye everyone!");
				gameLogic(GameState.INIT)
				break;
			default:
				break;
		}
	}
	else // Game actions
	{
		switch (currentState) {
			case GameState.INIT:
				if (!players.includes(member))
				{
					players.push(member);
					message.reply('Hi 😀\nThere are ' + players.length + ' players.');
					saySomething(member.displayName + " joined the game!");
				}
				else
				{
					message.reply("You are already in the game!")
				}
				break;
			case expression:

				break;
			default:

		}
	}
}

function gotReaction(reaction, user)
{
	reaction.message.reply('You reacted!');
}

function gameLogic(nextState)
{
	currentState = nextState;
	switch (nextState) {
		case GameState.INIT:
			hitlerID = -1;
			facistsIDs = [];
			players = [];
		case GameState.NOMINATE_CHANCELLOR:

		case expression:

			break;
		default:

	}
}

function printGameState()
{

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
            // channel.join().then((connection) => {
            //     connection.play(soundPath);
            // }).catch((err) => {
            //     console.error(err);
            // });
			connection.play(soundPath);
        }
    });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
