import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "fero-dc";
import { prisma } from "../../util/prisma-client";

export default new Command()
	.setName("remove-funnie")
	.setDescription("Remove a funnie from the database")
	.setCategory("Funnies")
	.setOptions({
		name: "message-id",
		description: "The ID of the message to remove",
		type: ApplicationCommandOptionType.String,
		required: true
	})
	.setRun(async (client, interaction) => {
		await interaction.deferReply();

		const guild = interaction.guild;
		if (guild === null) {
			await interaction.followUp({
				content: "This command can only be used in a server."
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
				content: "This server has not been initialized."
			});

			return;
		}
		if (!guildModel.features.funnies) {
			await interaction.followUp({
				content: "Funnies are not enabled in this server."
			});

			return;
		}

		const messageId = interaction.options.getString("message-id", true);
		const funnie = await prisma.funnie.findUnique({
			where: {
				id: messageId
			}
		});
		if (funnie === null) {
			await interaction.followUp({
				content: "That message is not a funnie."
			});

			return;
		}

		// delete the embed message
		const funnieChannel = await guild.channels.fetch(
			guildModel.channelIds.funnies
		);
		if (funnieChannel === null || !funnieChannel.isTextBased()) {
			await interaction.followUp({
				content: "The funnies channel is not set up."
			});

			return;
		}

		const funnieEmbedMessage = await funnieChannel.messages.fetch(
			funnie.embedMessageId
		);
		if (funnieEmbedMessage === null) {
			await interaction.followUp({
				content: "The funnie embed message was not found."
			});

			return;
		}
		await funnieEmbedMessage.delete();

		await prisma.funnie.delete({
			where: {
				id: messageId
			}
		});
		await interaction.followUp({
			content: "Removed funnie."
		});
	});
