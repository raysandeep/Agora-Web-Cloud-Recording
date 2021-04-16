// JS reference to the container where the remote feeds belong
let remoteContainer = document.getElementById("remote-container");
let baseUrl = "";

/**
 * @name addVideoContainer
 * @param uid - uid of the user
 * @description Helper function to add the video stream to "remote-container"
 */
function addVideoContainer(uid) {
	let streamDiv = document.createElement("div"); // Create a new div for every stream
	streamDiv.id = uid; // Assigning id to div
	streamDiv.style.transform = "rotateY(180deg)"; // Takes care of lateral inversion (mirror image)
	remoteContainer.appendChild(streamDiv); // Add new div to container
}
/**
 * @name removeVideoContainer
 * @param uid - uid of the user
 * @description Helper function to remove the video stream from "remote-container"
 */
function removeVideoContainer(uid) {
	let remDiv = document.getElementById(uid);
	remDiv && remDiv.parentNode.removeChild(remDiv);
}

/**
 * @name getToken
 * @param uid - Channel Name
 * @description Helper function to fetch tokens from token server.
 */
async function getToken(channelName) {
	const data = await fetch(
		`${baseUrl}/api/get/rtc/${channelName}`
	).then((response) => response.json());

	console.log(data);

	return data;
}

document.getElementById("start").onclick = async function () {
	// Client Setup
	// Defines a client for RTC
	const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

	// Get credentials from the form
	let appId = document.getElementById("app-id").value;
	let channelId = document.getElementById("channel").value;
	let data = await getToken(channelId);
	let token = data.rtc_token;
	let uid = data.uid;
	console.log(token, uid);
	// Create local tracks
	const [
		localAudioTrack,
		localVideoTrack,
	] = await AgoraRTC.createMicrophoneAndCameraTracks();

	// Initialize the stop button
	initStop(client, localAudioTrack, localVideoTrack);

	// Play the local track
	localVideoTrack.play("me");

	// Set up event listeners for remote users publishing or unpublishing tracks
	client.on("user-published", async (user, mediaType) => {
		await client.subscribe(user, mediaType); // subscribe when a user publishes
		if (mediaType === "video") {
			addVideoContainer(String(user.uid)); // uses helper method to add a container for the videoTrack
			user.videoTrack.play(String(user.uid));
		}
		if (mediaType === "audio") {
			user.audioTrack.play(); // audio does not need a DOM element
		}
	});
	client.on("user-unpublished", async (user, mediaType) => {
		if (mediaType === "video") {
			removeVideoContainer(user.uid); // removes the injected container
		}
	});

	// Join a channnel and retrieve the uid for local user
	const _uid = await client.join(appId, channelId, token, uid);
	await client.publish([localAudioTrack, localVideoTrack]);

	// Initialize the start recording button
	document.getElementById("startRecording").disabled = false;
};

function initStop(client, localAudioTrack, localVideoTrack) {
	const stopBtn = document.getElementById("stop");
	stopBtn.disabled = false; // Enable the stop button
	stopBtn.onclick = null; // Remove any previous event listener
	stopBtn.onclick = function () {
		client.unpublish(); // stops sending audio & video to agora
		localVideoTrack.stop(); // stops video track and removes the player from DOM
		localVideoTrack.close(); // Releases the resource
		localAudioTrack.stop(); // stops audio track
		localAudioTrack.close(); // Releases the resource
		client.remoteUsers.forEach((user) => {
			if (user.hasVideo) {
				removeVideoContainer(user.uid); // Clean up DOM
			}
			client.unsubscribe(user); // unsubscribe from the user
		});
		client.removeAllListeners(); // Clean up the client object to avoid memory leaks
		stopBtn.disabled = true;
	};
}

document.getElementById("startRecording").onclick = async function () {
	let channelId = document.getElementById("channel").value;
	startcall = await fetch(`${baseUrl}/api/start/call`, {
		method: "post",
		headers: {
			"Content-Type": "application/json; charset=UTF-8",
			Accept: "application/json",
		},
		body: JSON.stringify({ channel: channelId }),
	}).then((response) => response.json());
	console.log(startcall.data);
	initStopRecording(startcall.data);
	document.getElementById("startRecording").disabled = true;
};

function initStopRecording(data) {
	const stopBtn = document.getElementById("stopRecording");
	stopBtn.disabled = false;
	stopBtn.onclick = null;
	stopBtn.onclick = async function () {
		stopcall = await fetch(`${baseUrl}/api/stop/call`, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}).then((response) => response.json());

		console.log(stopcall.message);
		stopBtn.disabled = true;
		document.getElementById("startRecording").disabled = false;
	};
}
