import { useState } from "react";
import { CheckCircle, Circle } from "react-feather";
import * as uug from "unique-username-generator";
import { localUser } from "../App";
import { ActionTypes, getRandomKey, joinClassNames } from "../Classes/Constants";
import { onDisconnectedFromDatabase, writeToDatabase } from "../Classes/Database";
import { dispatcher } from "../Classes/Dispatcher";
import { packDescriptions, questionPacks } from "../Classes/Packs";
import { Room } from "../Classes/Stores/RoomStore";
import TenorClient from "../Classes/TenorClient";
import { copyToClipboard } from "../Components/Modals";
import { openGifPicker } from "../Components/PageElements/GifPicker";
import Tooltip from "../Components/Tooltip";
import "./Home.scss";

function StartupScreen() {
	dispatcher.useForceUpdater(ActionTypes.UPDATE_USER);
	const [busy, setBusy] = useState(false);
	const [packs, setPacks] = useState(Object.keys(questionPacks).filter(p => !["offensive"].includes(p)));

	const actions = {
		createRoom: async () => {
			setBusy(true);
			if (busy) return;

			const id = getRandomKey();
			copyToClipboard(`https://gif-off.web.app/game/${id}`);

			const users = { [localUser.id]: localUser };
			const botCount = parseInt(document.getElementById("IBotCount").value) || 0;
			for (let i = 0; i < botCount; i++) {
				const botId = getRandomKey();
				users[botId] = {
					id: botId,
					username: "[BOT] " + uug.uniqueUsernameGenerator({
						dictionaries: [uug.adjectives, uug.nouns, uug.adjectives, uug.nouns, uug.adjectives, uug.nouns],
						separator: "",
						style: "capital"
					}),
					avatar: await TenorClient.search(getRandomKey(), { limit: 1 }).then(({ results }) => results[0].media[0].tinygif.url),
					bot: true
				};
			}

			const room = new Room({
				id,
				hostId: localUser.id,
				users,
				botCount,
				maxScore: parseInt(document.getElementById("IMaxScore").value) || 0,
				voteTimeout: parseInt(document.getElementById("IVoteTimeout").value) || 0,
				gifFilters: document.getElementById("IGifFilters").value || ""
			});

			writeToDatabase(room, "rooms", id);
			onDisconnectedFromDatabase("rooms", id).set(null);

			dispatcher.dispatch({
				type: ActionTypes.UPDATE_ROOM,
				room
			});

			dispatcher.dispatch({
				type: ActionTypes.UPDATE_ROUTE,
				path: "/game/" + id
			});

			setBusy(false);
		}
	};

	const clampInt = e => {
		const value = parseInt(e.currentTarget.value);

		if (isNaN(value)) {
			e.currentTarget.value = "";
		}
		else {
			if (value > parseInt(e.currentTarget.max)) {
				e.currentTarget.value = e.currentTarget.max;
			}
			else if (value < parseInt(e.currentTarget.min)) {
				e.currentTarget.value = e.currentTarget.min;
			}
		}
	};

	return (
		<div className="Screen StartupScreen">
			<div className="Buttons FlexCenter">
				{localUser && (
					<>
						<div className="FlexCenter">
							<div className="ProfilePicker" onClick={() => openGifPicker().then(item => {
								const { url } = item.media[0].gif;

								localUser.avatar = url;
								localStorage.setItem("localUser", JSON.stringify(localUser));
								dispatcher.dispatch({ type: ActionTypes.UPDATE_USER });
							})}>
								<img className="Avatar" src={localUser.avatar} />
							</div>

							<div className="InputContainer FlexCenter ProfileUsername">
								<div className="Title">Username</div>
								<input className="Input" placeholder="Username" defaultValue={localUser.username} maxLength={32} style={{ width: "80%" }} onBlur={e => {
									localUser.username = e.currentTarget.value;
									localUser.hasSetUsername = true;

									localStorage.setItem("localUser", JSON.stringify(localUser));
									dispatcher.dispatch({ type: ActionTypes.UPDATE_USER });
								}} />
							</div>
						</div>

						<div className="Divider"></div>
					</>
				)}

				<div className="InputContainer FlexCenter">
					<div className="Title">Max Score</div>
					<input id="IMaxScore" className="Input" placeholder="Unlimited" maxLength={3} type="number" min={0} max={999} onBlur={clampInt} />
				</div>

				<div className="InputContainer FlexCenter">
					<div className="Title">Bot Count</div>
					<input id="IBotCount" className="Input" placeholder="None" maxLength={3} type="number" min={0} max={10} onBlur={clampInt} />
				</div>

				<div className="InputContainer FlexCenter">
					<div className="Title">Vote Timer</div>
					<input id="IVoteTimeout" className="Input" placeholder="Unlimited" maxLength={3} type="number" min={0} max={300} onBlur={clampInt} />
				</div>

				<div className="InputContainer FlexCenter">
					<div className="Title">Gif Filters</div>
					<input id="IGifFilters" className="Input" placeholder="None" maxLength={32} />
				</div>

				<div className="InputContainer FlexCenter">
					<div className="Title">Question Packs</div>

					<div className="PacksList FlexCenter">
						{Object.keys(questionPacks).map(pack => (
							<div className={joinClassNames("PackItem", "FlexCenter", [packs.includes(pack), "AddItem"])} onClick={() => {
								setPacks(packs.includes(pack) ? packs.filter(p => p !== pack) : [...packs, pack]);
							}}>
								<div className="Text">{pack}</div>

								<Tooltip key={getRandomKey()}>{packDescriptions[pack]}</Tooltip>

								{packs.includes(pack) ? <CheckCircle /> : <Circle />}
							</div>
						))}
					</div>
				</div>

				<div className="Button" onClick={actions.createRoom}>Create Room</div>
			</div>
		</div>
	);
}

export default function HomePage() {
	const [currentScreen, setCurrentScreen] = useState(<StartupScreen />);
	const [nextScreen, setNextScreen] = useState(null);

	return (
		<div className="HomePage">
			{currentScreen}
		</div>
	);
}