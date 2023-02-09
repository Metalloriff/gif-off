import randomUsernameGenerator from "random-username-generator";
import { useState } from "react";
import "./App.scss";
import background from "./Assets/background.jpg";
import "./city-fog-theme.css";
import { ActionTypes, getRandomKey, joinClassNames } from "./Classes/Constants";
import { dispatcher } from "./Classes/Dispatcher";
import { useEventListener, useMediaQuery } from "./Classes/Hooks";
import RoutesStore from "./Classes/Stores/RoutesStore";
import TenorClient from "./Classes/TenorClient";
import ContextMenu from "./Components/ContextMenuHandler";
import { Modals } from "./Components/Modals";
import GifPicker from "./Components/PageElements/GifPicker";
import PageFooter from "./Components/PageElements/PageFooter";
import Toasts from "./Components/Toasts";
import GameRoom from "./Pages/GameRoom";
import HomePage from "./Pages/Home";

function PageElement() {
	// Use the page route state
	RoutesStore.useState(() => RoutesStore.getCurrentRoute());
	// Get the hash and arguments from the formatted route
	const [hash, ...args] = RoutesStore.getFormattedRoute();

	// Zhu Li, do the thing!
	switch (hash) {
		default: return <HomePage />;
		case "game":
			return <GameRoom roomId={args[0]} />;
	}
}

function BackgroundImage() {
	const [transform, setTransform] = useState("");

	useEventListener("mousemove", e => {
		const { clientX: x, clientY: y } = e;
		const depth = -0.01;

		setTransform(`scale(1.1) translate(${(x - (screen.width / 2)) * depth}px, ${(y - (screen.height / 2)) * depth}px)`);
	});

	return (
		<img className="Background" src={background} style={{ transform }} />
	);
}

export let localUser = localStorage.getItem("localUser") && JSON.parse(localStorage.getItem("localUser"));

if (!localUser) {
	TenorClient.random("galaxy space aesthetic wallpaper").then(({ results: [pfp] }) => {
		localUser = {
			id: getRandomKey(),
			username: randomUsernameGenerator.generate(),
			avatar: pfp.media[0].tinygif.url
		};

		dispatcher.dispatch({ type: ActionTypes.UPDATE_USER });
		localStorage.setItem("localUser", JSON.stringify(localUser));
	});
}

export default function App() {
	const isMobile = useMediaQuery("max-width", 700);

	return (
		<div className={joinClassNames("App", [isMobile, "Mobile"])}>
			<BackgroundImage />

			<div className="Main">
				<PageElement />

				<GifPicker />
			</div>

			<PageFooter />

			<Modals />
			<Toasts />
			<ContextMenu.Handler />
		</div>
	);
}