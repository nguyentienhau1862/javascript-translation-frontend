import { languageMap } from "./constants";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getLanguagePrompt(locales = [], newData = {}) {
	const targetLanguages = locales.map((locale) => `"${locale}": "${languageMap[locale]}"`).join(",\n\t\t");
	return `
		Task: Translate the string values of the provided English JSON data into multiple languages.

		Requirements:
		- The output must be a SINGLE valid JSON object.
		- The top-level keys of the output JSON object MUST be the locale codes for each target language.
		- For each locale key, the value MUST be a JSON object containing the translated strings for that language.
		- Keep all keys and the internal structure exactly as the original for each language's JSON object.
		- Only translate the string values.
		- Ensure the output is a valid JSON object.
		- Do not include any text, explanations, or markdown code fences around the JSON output.

		Target Languages (Locale: Language Name):
		{
			${targetLanguages}
		}

		Here is the English JSON data to translate:
		${JSON.stringify(newData, null, 4)}
	`;
}

function fillData(source = {}, payload = {}) {
	if (source?.constructor === payload?.constructor) {
		if (source.constructor === Object) {
			return Object.entries(source).reduce(function (result, [key, value]) {
				result[key] = fillData(value, payload[key]);
				return result;
			}, {});
		} else {
			return payload;
		}
	}
	return source;
}

function getLockData(enData = {}, lockData = {}) {
	if (enData?.constructor === lockData?.constructor) {
		if (enData.constructor === Object) {
			return Object.entries(enData).reduce(function (result, [key, value]) {
				const data = getLockData(value, lockData[key]);
				if (data !== null && JSON.stringify(data) !== "{}") result[key] = data;
				return result;
			}, {});
		} else if (enData === lockData) {
			return enData;
		}
	}
	return null;
}

function getLocaleData(lockData = {}, localeData = {}) {
	if (lockData?.constructor === localeData?.constructor) {
		if (lockData.constructor === Object) {
			return Object.entries(lockData).reduce(function (result, [key, value]) {
				const data = getLocaleData(value, localeData[key]);
				if (data !== null && JSON.stringify(data) !== "{}") result[key] = data;
				return result;
			}, {});
		} else {
			return localeData;
		}
	}
	return null;
}

function getMissingData(lockData = {}, localeData = {}) {
	if (lockData?.constructor === localeData?.constructor) {
		if (lockData.constructor === Object) {
			return Object.entries(lockData).reduce(function (result, [key, value]) {
				const data = getMissingData(value, localeData[key]);
				if (data !== null && JSON.stringify(data) !== "{}") result[key] = data;
				return result;
			}, {});
		} else {
			return null;
		}
	}
	return lockData;
}

export function checkData(source = {}) {
	return source?.constructor === Object ? Object.values(source).some(checkData) : !!source;
}

export function readLocalesData(files = []) {
	return files;
}

export function printLocalesData(data = {}, type = "file") {}

export async function translateLocalesData(geminiKey = "", localesData = [], printType = "file") {
	const numberPerRequest = 4;
	const genAI = new GoogleGenerativeAI(geminiKey);
	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash-lite",
		generationConfig: { responseMimeType: "application/json" }
	});
	const locales = Object.keys(languageMap);

	for (let index = 0; index < locales.length; index += numberPerRequest) {
		const localesToTranslate = locales.slice(index, index + numberPerRequest);
		const prompt = getLanguagePrompt(localesToTranslate, localesData.new);

		console.log("Sending translation request to Gemini for locales:", localesToTranslate.join(", "));

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const translatedString = response.text();
		printLocalesData({ log: response }, "file");

		console.log("Received translation from Gemini.");

		const translatedJson = JSON.parse(translatedString);

		for (const key of localesToTranslate) {
			const missingData = getMissingData(localesData.new, translatedJson[key]);

			if (checkData(missingData)) {
				console.log(`Missing translated data in ${key} locale:`, JSON.stringify(missingData, null, 4));
			}

			localesData[key] = fillData(fillData(localesData.en, localesData[key]), translatedJson[key]);
			printLocalesData(localesData[key], printType);

			console.log(key + " locale data updated");
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	printLocalesData({ en: localesData.en }, printType);
	printLocalesData({ lock: localesData.en }, printType);
}
