import { AppTiles } from "../../../components/app-tiles";
import { AppTitleBar } from "../../../components/app-title-bar";
import './styles.css';

export function Component() {
	return <div className="page-home">
		<AppTitleBar title="Block Game Tools"></AppTitleBar>
		<div className="home-title">
			<h1>Block Game Tools</h1>
			<AppTiles />
		</div>
	</div>;
}