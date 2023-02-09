// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import * as realtime from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyCtVBFxzrXiZxdoStCj8boGNi3-nyl_-Fg",
	authDomain: "gif-off.firebaseapp.com",
	projectId: "gif-off",
	storageBucket: "gif-off.appspot.com",
	messagingSenderId: "1014990655088",
	appId: "1:1014990655088:web:42956760bd3ef4054eaeb5"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = realtime.getDatabase(firebaseApp);

export function getFromDatabase(...path) {
	return realtime.get(realtime.ref(db, path.join("/")));
}

export function writeToDatabase(data, ...path) {
	return realtime.set(realtime.ref(db, path.join("/")), data);
}

export function overwriteToDatabase(data, ...path) {
	return realtime.update(realtime.ref(db, path.join("/")), data);
}

export function onDatabaseValue(callback, ...path) {
	return realtime.onValue(realtime.ref(db, path.join("/")), callback);
}

export function onDisconnectedFromDatabase(...path) {
	return realtime.onDisconnect(realtime.ref(db, path.join("/")));
}