import { useEffect, useReducer, useState } from "react";
import { localUser } from "../App";
import { ActionTypes, joinClassNames } from "../Classes/Constants";
import { onDatabaseValue, onDisconnectedFromDatabase, overwriteToDatabase, writeToDatabase } from "../Classes/Database";
import { dispatcher } from "../Classes/Dispatcher";
import RoomStore, { Room, RoomStage } from "../Classes/Stores/RoomStore";
import { openGifPicker } from "../Components/PageElements/GifPicker";
import "./GameRoom.scss";

function Queue({ room }) {
	return (
		<div className="Queue FlexCenter">
			<div className="GameDetails FlexCenter">
				<img src={room.users[room.hostId]?.avatar} alt="Host Avatar" className="Avatar" />

				<div className="Title">
					{room.users[room.hostId].username}'s Room
				</div>
			</div>

			<div className="Users FlexCenter">
				<h2 className="UsersTitle">Players</h2>
				{Object.values(room.users).map(user => user && (
					<div className="UserItem FlexCenter" key={user.id}>
						<img src={user.avatar} alt="Avatar" className="Avatar" />

						<div className="Username">{user.username}</div>
					</div>
				))}
			</div>

			{localUser.id === room.hostId ? (
				<div className="Button StartButton" onClick={() => {
					overwriteToDatabase({
						stage: RoomStage.PICK_GIF
					}, "rooms", room.id);
				}}>Start Game</div>
			) : (
				<div className="Button StartButton">Waiting for Host</div>
			)}
		</div>
	);
}

function Scoreboard({ room }) {
	dispatcher.useForceUpdater(ActionTypes.UPDATE_ROOM);

	const scores = RoomStore.useState(() => RoomStore.getCurrentRoom().scores);
	const users = Object.keys(RoomStore.useState(() => RoomStore.getCurrentRoom().users));

	return (
		<div className="Scoreboard FlexCenter">
			<h4>Scoreboard</h4>

			<div className="Items FlexCenter">
				{users.map(userId => (
					<div className="ScoreItem FlexCenter" key={userId}>
						<div className="AvatarContainer">
							<img src={room.users[userId]?.avatar} alt="Avatar" className="Avatar" />

							<div className="ScoreBlip FlexCenter">{scores[userId] ?? 0}</div>
						</div>

						<div className="Username">{room.users[userId].username}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function Game({ room }) {
	dispatcher.useForceUpdater(ActionTypes.UPDATE_ROOM);

	const [winner, setWinner] = useState(null);
	const [winTime, setWinTime] = useState(0);
	const [timerInterval, setTimerInterval] = useState(null);
	const question = RoomStore.useState(() => RoomStore.getCurrentRoom().currentQuestion);
	const forceUpdate = useReducer(x => x + 1, 0)[1];

	const selectGif = () => {
		openGifPicker().then(item => {
			const { url } = item.media[0].gif;

			writeToDatabase(url, "rooms", room.id, "gifs", localUser.id);
		});
	};

	useEffect(() => {
		if (localUser.id === room.hostId) {
			switch (room.stage) {
				case RoomStage.PICK_GIF: {
					overwriteToDatabase({
						gifs: {},
						votes: {},
						winner: null,
						currentQuestion: room.getQuestion()
					}, "rooms", room.id);
				} break;
			}
		}

		switch (room.stage) {
			case RoomStage.PICK_GIF: {
				selectGif();
			} break;
		}
	}, [room.stage]);

	useEffect(() => {
		const winner = room.getWinner();
		clearTimeout(timerInterval);

		if (winner) {
			setTimerInterval(setInterval(() => {
				forceUpdate();
			}, 1000));
		}

		if (winner && localUser.id === room.hostId) {
			for (const userId in room.users) {
				if (!room.scores[userId])
					room.scores[userId] = 0;
				room.scores[userId] += room.getVoteCountForUser(userId);
			}

			writeToDatabase(room.scores, "rooms", room.id, "scores");

			setTimeout(() => {
				overwriteToDatabase({
					gifs: {},
					votes: {},
					winner: null,
					stage: RoomStage.PICK_GIF,
					currentQuestion: room.getQuestion()
				}, "rooms", room.id);
			}, 10 * 1000);
		}
	}, [room.getWinner()]);

	if (localUser.id === room.hostId) {
		if (room.stage === RoomStage.PICK_GIF && room.getPlayerWaitingForCount() === 0) {
			writeToDatabase(RoomStage.VOTE_GIF, "rooms", room.id, "stage");
		}
	}

	return (
		<div className="Game FlexCenter">
			<Scoreboard room={room} />

			<h1 className="Question">
				{winner
					? <>{winner} got the most points this round!</>
					: question || "Waiting for host..."}
			</h1>

			<h3 className="Status">{
				winner ? <>Next round in {Math.ceil(Math.abs((10 * 1000) - (performance.now() - winTime)) / 1000)} seconds...</> :
					room.getPlayerWaitingForCount() > 0
						? room.getPlayerWaitingForCount() > 1
							? <>Waiting for {room.getPlayerWaitingForCount()} players...</>
							: <>We're all waiting on you, {room.getLastAwaitedPlayer().username}.</>
						: "Vote for the best response"
			}</h3>

			{room.stage === RoomStage.PICK_GIF ? (
				room.gifs[localUser.id] ? (
					<div className="CurrentGifContainer" onClick={selectGif}>
						<img src={room.gifs[localUser.id]} alt="Gif" className="Gif" />
					</div>
				) : null
			) : (
				room.stage === RoomStage.VOTE_GIF ? (
					<div className="GifVotes FlexCenter">
						{Object.entries(room.gifs).map(([userId, uri]) => (
							<div className={joinClassNames("GifContainer", [userId === localUser.id, "Self"], [room.votes[userId] === userId, "Voted"], [Object.keys(room.votes).length === Object.keys(room.users).length, room.getWinner() === userId ? "Winner" : "Loser"])} key={userId} onClick={() => {
								if (userId !== localUser.id && !room.getWinner()) {
									writeToDatabase(userId, "rooms", room.id, "votes", localUser.id);
								}
							}}>
								{room.getVoteCountForUser(userId) > 0 ? (
									<div className="VoteCount FlexCenter">{room.getVoteCountForUser(userId)}</div>
								) : null}

								<img src={uri} alt="Gif" className="Gif" />

								{room.getWinner() ? (
									<div className="UserContainer FlexCenter">
										<img src={room.users[userId]?.avatar} alt="Avatar" className="Avatar" />

										<div className="Username">{room.users[userId]?.username}</div>
									</div>
								) : null}
							</div>
						))}
					</div>
				) : null
			)}
		</div>
	);
}

export default function GameRoom({ roomId }) {
	const room = RoomStore.useState(() => RoomStore.getCurrentRoom());

	useEffect(() => {
		async function announcePresence() {
			while (!localUser)
				await new Promise(r => setTimeout(r, 250));

			writeToDatabase(localUser, "rooms", roomId, "users", localUser.id);
		}

		announcePresence();
		onDisconnectedFromDatabase("rooms", roomId, "users", localUser.id).set(null);

		return onDatabaseValue(snapshot => dispatcher.dispatch({
			type: ActionTypes.UPDATE_ROOM,
			room: new Room(snapshot.val())
		}), "rooms", roomId);
	}, []);

	return room ? (
		<div className="GameRoom">
			{room.stage === RoomStage.WAITING_FOR_PLAYERS
				? <Queue room={room} />
				: <Game room={room} />}
		</div>
	) : null;
}