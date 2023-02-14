import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js";
import { Command } from "fero-dc";
import { prisma } from "../../util/prisma-client";
import { LogType } from "../../util/types";

export default new Command()
	.setName("lookup")
	.setDescription("Lookup a user or log entry")
	.setCategory("Moderation")
	.setOptions(
		{
			name: "user",
			description: "Lookup a user and see their logs",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					description: "The user to lookup",
					type: ApplicationCommandOptionType.User,
					required: true
				}
			]
		},
		{
			name: "log",
			description: "Lookup a log entry",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "log-id",
					description: "The ID of the log entry",
					type: ApplicationCommandOptionType.Integer,
					required: true
				}
			]
		}
	)
	.setRun(async (client, interaction) => {
		await interaction.deferReply({
			ephemeral: true
		});

		const guild = interaction.guild;
		if (guild === null) {
			await interaction.followUp({
				content: "This command can only be used in a server."
			});

			return;
		}

		const author = interaction.user;

		const subcommand = interaction.options.getSubcommand(true);
		if (subcommand === "user") {
			const user = interaction.options.getUser("user", true);

			const logModels = await prisma.log.findMany({
				where: {
					guildId: guild.id,
					targetId: user.id
				}
			});
			const logFields = logModels.map((logModel) => {
				const logType = LogType[logModel.type]
					.replace(/([A-Z])/g, " $1")
					.trim();

				return {
					name: `${logModel.logId} - ${logType}`,
					value: logModel.reason,
					inline: false
				};
			});

			const embed = new EmbedBuilder()
				.setTitle("Delta: User Logs")
				.setDescription(`${user.tag} has ${logModels.length} entries!`)
				.setColor(Colors.Blurple)
				.setAuthor({
					name: author.username ?? "",
					iconURL: author.avatarURL() ?? ""
				})
				.addFields(
					{
						name: "Currently Banned",
						value: guild.bans.cache.get(user.id) ? "Yes" : "No",
						inline: false
					},
					...logFields
				)
				.setTimestamp()
				.setFooter({
					text: "Delta, The Wings of Fire Moderation Bot",
					iconURL: client.user.avatarURL() ?? ""
				});

			await interaction.followUp({
				embeds: [embed],
				ephemeral: true
			});
		} else {
			const logId = interaction.options.getInteger("log-id", true);
			const logModel = await prisma.log.findFirst({
				where: {
					guildId: guild.id,
					logId
				}
			});
			if (logModel === null) {
				await interaction.followUp({
					content: "That log entry does not exist.",
					ephemeral: true
				});

				return;
			}

			const guildModel = await prisma.guild.findUnique({
				where: {
					id: guild.id
				}
			});
			if (guildModel === null) {
				await interaction.followUp({
					content: "This guild does not exist in the database.",
					ephemeral: true
				});

				return;
			}

			const logsChannel = await guild.channels.fetch(
				guildModel.channelIds.logs
			);
			if (logsChannel === null || !logsChannel.isTextBased()) {
				await interaction.followUp({
					content: "The logs channel is not a text channel or does not exist.",
					ephemeral: true
				});

				return;
			}

			const embedMessage = await logsChannel.messages.fetch(
				logModel.embedMessageId
			);
			if (embedMessage === null) {
				await interaction.followUp({
					content: "The log entry's embed does not exist.",
					ephemeral: true
				});

				return;
			}

			const embed = embedMessage.embeds[0];
			if (embed === null) {
				await interaction.followUp({
					content: "The log entry's embed does not exist.",
					ephemeral: true
				});

				return;
			}

			await interaction.followUp({
				embeds: [embed],
				ephemeral: true
			});
		}
	});
