import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
	return (
		<div className="app-container">
			<div className="form-field">
				<label for="gemini-key">Enter gemini key</label>
				<input type="text" id="gemini-key" />
			</div>
			<div className="form-field">
				<label for="file-upload">Upload locale files</label>
				<input type="file" id="file-upload" webkitdirectory="true" multiple />
			</div>
			<div className="translate-result">
				<div className="translated-files">
					<div>Translated Files</div>
				</div>
				<div className="translate-errors">
					<div>Translate Errors</div>
				</div>
				<div className="translate-logs">
					<div>Translate Logs</div>
				</div>
			</div>
		</div>
	);
}

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>
);
