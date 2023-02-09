import { useState } from "react";
import { localUser } from "../App";
import { ActionTypes, getRandomKey } from "../Classes/Constants";
import { onDisconnectedFromDatabase, writeToDatabase } from "../Classes/Database";
import { dispatcher } from "../Classes/Dispatcher";
import { Room } from "../Classes/Stores/RoomStore";
import { copyToClipboard } from "../Components/Modals";
import { openGifPicker } from "../Components/PageElements/GifPicker";
import "./Home.scss";

function StartupScreen() {
	dispatcher.useForceUpdater(ActionTypes.UPDATE_USER);

	const actions = {
		createRoom: () => {
			const id = getRandomKey();
			copyToClipboard(id);

			const room = new Room({
				id,
				hostId: localUser.id,
				users: { [localUser.id]: localUser }
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
		},
		joinRoom: () => {
			const id = document.getElementById("JoinRoomId").value;

			dispatcher.dispatch({
				type: ActionTypes.UPDATE_ROUTE,
				path: "/game/" + id
			});
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
								<div className="Label">Username</div>
								<input className="Input" placeholder="Username" defaultValue={localUser.username} maxLength={32} style={{ width: "80%" }} onBlur={e => {
									localUser.username = e.currentTarget.value;
									localStorage.setItem("localUser", JSON.stringify(localUser));
									dispatcher.dispatch({ type: ActionTypes.UPDATE_USER });
								}} />
							</div>
						</div>

						<div className="Divider"></div>
					</>
				)}

				{/* <div className="InputContainer FlexCenter">
					<input id="MaxScoreValue" className="Input" placeholder="Max score" maxLength={3} type="number" min={0} max={999} />
				</div> */}

				<div className="Button" onClick={actions.createRoom}>Create Room</div>

				<div className="Divider" />

				<div className="InputContainer FlexCenter">
					<input id="JoinRoomId" className="Input" placeholder="Room ID" maxLength={7} />
				</div>
				<div className="Button" onClick={actions.joinRoom}>Join Room</div>
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