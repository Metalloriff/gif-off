import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { ChevronsUp, Grid } from "react-feather";
import { getRandomKey, joinClassNames } from "../../Classes/Constants";
import TenorClient from "../../Classes/TenorClient";
import Tooltip from "../Tooltip";
import "./GifPicker.scss";

export let openGifPicker;

export default function GifPicker() {
	const [query, search] = useState("");
	const [trending, setTrending] = useState([]);
	const [items, setItems] = useState([]);
	const [open, setOpen] = useState(false);
	const [pickingCallback, setPickingCallback] = useState(null);

	useEffect(() => {
		TenorClient.getTrending().then(({ results }) => (setTrending(results), setItems(results)));

		openGifPicker = async function () {
			setOpen(true);


			return new Promise(async (resolve, reject) => {
				setPickingCallback({ resolve, reject });
			});
		}
	}, []);

	const makeRequest = useCallback(
		_.debounce((query, prepend = []) => {
			TenorClient.search(query).then(response => {
				setItems([
					...prepend,
					...response.results
				]);
			});
		}, 200),
		[]
	);

	useEffect(() => {
		if (!query.trim()) {
			setItems(trending);
		}
		else {
			makeRequest(query);
		}
	}, [query]);

	const onClick = item => {
		if (pickingCallback) {
			pickingCallback.resolve(item);

			return setOpen(false), setPickingCallback(null);
		}
	};

	// useEffect(() => {
	// 	if (!open) {
	// 		setPickingCallback(null);
	// 	}
	// }, [open]);

	return (
		<div className={joinClassNames("GifPicker", [open, "Open"])}>
			<div className="SlideButton FlexCenter" onClick={() => setOpen(!open)}>
				<ChevronsUp />
			</div>

			<div className="SearchBarContainer FlexCenter">
				<div className="RandomButton FlexCenter" onClick={() => TenorClient.search(getRandomKey()).then(({ results }) => setItems(results))}>
					<Grid />

					<Tooltip>Random</Tooltip>
				</div>

				<input type="text" className="SearchBar" placeholder="🔍 Search, powered by Tenor" onChange={e => search(e.currentTarget.value)} />
			</div>

			<div className="Items FlexCenter AbsoluteCover">
				{items.map(item => (
					<div className="GifItemContainer" key={item.id} onClick={() => onClick(item)}>
						<img src={item.media[0].tinygif.url} alt="" />
					</div>
				))}
			</div>
		</div>
	);
}