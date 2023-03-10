import React from "react";
import * as Feather from "react-feather";
import { joinClassNames } from "../Classes/Constants";
import ErrorBoundary from "./ErrorBoundary";
import InlineLoading from "./InlineLoading";
import LinkWrapper from "./LinkWrapper";
import "./Modals.scss";
import Toasts from "./Toasts";
import Tooltip from "./Tooltip";

/**
 * Pushes a component to the modal stack.
 * @deprecated Use Modals.push(modal) instead.
 * @param modal The React component modal.
 */
export function openModal(modal) {
	Modals.push(modal);
}

/**
 * Close the last modal in the stack.
 * @deprecated Use Modals.pop() instead.
 */
export function closeModal() {
	Modals.pop().catch(console.error.bind(console, "Failed to pop modal!"));
}

/**
 * Copies the specified text to the clipboard
 * @param text The text to copy.
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
	try {
		await window.navigator.clipboard.writeText(text);

		Toasts.showToast(<span><b>{text.length >= 100 ? text.substr(0, 100) + "..." : text}</b> copied to clipboard</span>, "Success");
	}
	catch (e) {
		openStringModal({
			title: "Failed To Copy",
			description: "Your browser does not support copying to clipboard, you can manually copy here.",
			value: text
		});
	}
}

export function ImageModal({ url, getSources }) {
	// Get the sources or create a single-item array
	const sources = typeof (getSources) === "function" ? getSources().filter(u => u) : [url];

	// Create a state based on the index of the current url
	const [index, setIndex] = React.useState(sources.indexOf(url));
	// Create a navigate function to handle safely navigating images
	const nav = dir =>
		sources[index + dir]
			? (setLoaded(false), setFailed(false), setIndex(index + dir))
			: Toasts.showToast("No more images in this direction!", "Failure");
	// Create an expanded state based on the serialized settings state
	const [expanded, setExpandedState] = React.useState(false);

	// These are placeholders, I'm too lazy to add them
	const [loading, setLoaded] = React.useState(false);
	const [failed, setFailed] = React.useState(false);

	// Render bender
	return (
		<div className="ImageModal" onClick={e => e.target === e.currentTarget && Modals.pop()}>
			<div className={joinClassNames("ImageContainer", [expanded, "Expanded"])}
				onMouseDown={Modals.pop.bind(Modals)}>
				<img src={sources[index]} alt="Image failed to load"
					onLoad={() => (setLoaded(true), setFailed(false))}
					onError={() => (setLoaded(true), setFailed(true))} />
			</div>

			<div className="Footer">
				<div className={joinClassNames("Button Arrow Left",
					[!sources.length || !index, "Disabled"])} onClick={() => nav(-1)}>
					<Feather.ChevronLeft />
					<Tooltip>Previous Image</Tooltip>
				</div>

				<div className="Divider" />

				<div className="Filename">{
					sources[index].split("?")[0].split("/").slice(-1)[0].split("_").slice(-1)[0].replaceAll("%20", " ")
				}</div>

				<div className="Divider" />

				<div className="Button" onClick={() => (setExpandedState(!expanded))}>
					{expanded ? <Feather.Minimize2 /> : <Feather.Maximize2 />}
					<Tooltip>{expanded ? "Compress" : "Expand"}</Tooltip>
				</div>

				<div className="Button" onClick={() => copyToClipboard(sources[index])}>
					<Feather.Clipboard />
					<Tooltip>Copy URL</Tooltip>
				</div>

				<LinkWrapper className="Button" style={{ display: "block", color: "white" }}
					href={sources[index]}>
					<Feather.ExternalLink />
					<Tooltip>Open In Browser</Tooltip>
				</LinkWrapper>

				<div className="Divider" />

				<div className={joinClassNames("Button Arrow Right",
					[!sources.length || index + 1 >= sources.length, "Disabled"])} onClick={() => nav(1)}>
					<Feather.ChevronRight />
					<Tooltip>Next Image</Tooltip>
				</div>
			</div>
		</div>
	);
}

/**
 * Pushes an image modal to the modal stack.
 * @param url The URI for the image to focus.
 * @param getSources? An option callback function that returns an array of URIs.
 */
export function openImageModal(url, getSources = null) {
	Modals.push(<ImageModal url={url} getSources={getSources} />);
}

/**
 * Displays a two-choice modal to the user.
 * @param title
 * @param description
 * @param yesText
 * @param noText
 * @param yesColor
 * @param noColor
 * @returns {Promise<boolean>}
 */
export async function openBoolModal({
	title = "",
	description = "",
	yesText = "Yes",
	noText = "No",
	yesColor = "var(--busy-color)",
	noColor = ""
}) {
	const response = await new Promise(resolve => {
		Modals.push(
			<div className="BoolModal PrimaryBg">
				<div className="Title" dangerouslySetInnerHTML={{ __html: title }} />
				<div className="Description" dangerouslySetInnerHTML={{ __html: description }} />

				<div className="Footer">
					<div className="Button TertiaryBg" onClick={() => resolve(false)} style={{ backgroundColor: noColor }}>{noText}</div>
					<div className="Button TertiaryBg" onClick={() => resolve(true)} style={{ backgroundColor: yesColor }}>{yesText}</div>
				</div>
			</div>
		);
	});

	Modals.pop();

	return response;
}

/**
 * Displays a string choice modal to the user.
 * @param options
 * @returns {Promise<string | null>}
 */
export async function openStringModal(options = {}) {
	const { async = false } = options;

	const response = await new Promise(resolve => {
		Modals.push(
			<StringModal resolve={resolve} {...options} />
		);
	});

	!async && Modals.pop();

	return response;
}

export class Modals extends React.Component {
	static instance;

	/**
	 * Pushes a component to the modal stack.
	 * @param modal The React component modal.
	 */
	static push(modal) {
		this.instance.setState({ stack: [...this.instance.state.stack, modal] });
	}

	/**
	 * Closes the last modal in the stack.
	 * @returns {Promise<void>}
	 */
	static async pop() {
		// Destructure the instance state
		const { stack, closing } = this.instance.state;
		const modal = stack[stack.length - 1];

		// If there is nothing to close, return
		if (!stack.length || !modal) return;

		// Push the modal to the closing state, activating the transition
		this.instance.setState({ closing: [...closing, modal] });

		// Wait for the transition
		await new Promise(r => setTimeout(r, 150));

		// Set the new state, removing the modal from both stack states
		this.instance.setState({
			stack: this.instance.state.stack.filter(m => m !== modal),
			closing: this.instance.state.closing.filter(m => m !== modal)
		});
	}

	state = { stack: [], closing: [] };

	componentDidMount() {
		// Assign the static instance variable
		Modals.instance = this;

		document.addEventListener("keydown", this.handleKey);
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKey);
	}

	handleKey = e => {
		if (e.key === "Escape") {
			Modals.pop();
		}
	};

	handleBackdropClick(e) {
		// Ensure that we're actually clicking the modal background
		if (e.target !== e.currentTarget) return;

		// If the modal has an on backdrop click prop, run it and return
		const { stack } = this.state;
		if (stack[stack.length - 1] && typeof (stack[stack.length - 1].props?.onBackdropClick) === "function")
			return stack[stack.length - 1].props.onBackdropClick();

		// K I L L
		Modals.pop().catch(console.error.bind(console, "Failed to pop modal!"));
	}

	render() {
		const { stack, closing } = this.state;

		return (
			<div className={"ModalStack" + (stack.length > closing.length ? " Active" : "")}>
				{stack.map((modal, id) => (
					<ErrorBoundary key={id}>
						<div className={"ModalContainer" +
							(~closing.indexOf(modal) || id < stack.length - 1 ? " Closing" : "")}
							onMouseDown={this.handleBackdropClick.bind(this)}
							style={{ zIndex: id * 10 }}>{modal}</div>
					</ErrorBoundary>
				))}
			</div>
		);
	}
}

export function StringModal(props) {
	const { title = "", description = "", yesText = "Confirm", noText = "Cancel", yesColor = "", noColor = "", value = "", onChange = null, rich = false, resolve, id } = props;
	const [no, setNoState] = React.useState(false);
	const [yes, setYesState] = React.useState(false);

	return (
		<div className="StringModal PrimaryBg">
			<div className="Title" dangerouslySetInnerHTML={{ __html: title }} />
			<div className="Description" dangerouslySetInnerHTML={{ __html: description }} />

			<input id={id} className="Field TertiaryBg" defaultValue={value} onChange={onChange} />

			<div className="Footer">
				<div className="Button TertiaryBg" onClick={() => (resolve(null), setNoState(true))} style={{ backgroundColor: noColor }}>{no ? <InlineLoading /> : noText}</div>
				<div className="Button TertiaryBg" onClick={() => (resolve(document.getElementById(id).value), setYesState(true))} style={{ backgroundColor: yesColor }}>{yes ? <InlineLoading /> : yesText}</div>
			</div>
		</div>
	);
}