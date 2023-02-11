import _ from "lodash";
import { ActionTypes } from "../Constants";
import { dispatcher } from "../Dispatcher";
import { questionPacks } from "../Packs";
import Store from "../Store";

let currentRoom;

export const RoomStage = {
	WAITING_FOR_PLAYERS: 0,
	PICK_GIF: 1,
	VOTE_GIF: 2,
	FINAL: 3
};

const usedQuestions = [];
export class Room {
	id;
	hostId;
	users = {};
	gifFilters = "";

	packs = Object.keys(questionPacks);
	botCount = 0;

	getRandomPlayer() {
		const players = Object.values(this.users).filter(user => !user.bot);

		return players[Math.floor(Math.random() * players.length)];
	}

	getQuestion() {
		// TODO add low chance to request question from random player
		const validQuestions = Object.entries(questionPacks).filter(([key, value]) => this.packs.includes(key)).map(([key, value]) => value).flat();
		let question;

		while (!question || ~usedQuestions.indexOf(question)) {
			question = validQuestions[Math.floor(Math.random() * validQuestions.length)];
		}

		usedQuestions.push(question);
		return question.replace("XNAME", this.getRandomPlayer().username);
	}

	getPlayerWaitingForCount() {
		return Math.abs(Object.keys(this.users).length - Object.keys(this.gifs).length);
	}

	getLastAwaitedPlayer() {
		for (const user of Object.values(this.users)) {
			if (!this.gifs[user.id] && !user.bot) {
				return user;
			}
		}
	}

	getVoteCountForUser(userId) {
		return Object.values(this.votes).filter(v => v === userId).length;
	}

	getVoteCounts() {
		const counts = {};

		for (const userId of Object.values(this.votes)) {
			if (!counts[userId])
				counts[userId] = 0;
			counts[userId]++;
		}

		return counts;
	}

	getWinner() {
		if (Object.keys(this.votes).length !== Object.keys(this.users).length - this.botCount)
			return null;

		const votes = this.getVoteCounts();
		let winner = null;

		for (const userId in votes) {
			if (!winner || votes[userId] > votes[winner]) {
				winner = userId;
			}
		}

		return winner;
	}

	currentQuestion = null;
	stage = RoomStage.WAITING_FOR_PLAYERS;
	gifs = {};
	votes = {};
	scores = {};
	winner = null;

	constructor(data) {
		_.extend(this, data);
	}
}

const RoomStoreClass = class RoomStore extends Store {
	getCurrentRoom() {
		return currentRoom;
	}

	getCurrentRoomHost() {
		return currentRoom?.hostId;
	}
}

const RoomStore = new RoomStoreClass(dispatcher, {
	[ActionTypes.UPDATE_ROOM]: ({ room }) => {
		currentRoom = room;
	}
})

export default RoomStore;