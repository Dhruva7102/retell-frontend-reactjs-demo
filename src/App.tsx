import React, { useEffect, useState } from "react";
import "./App.css";
import { RetellWebClient } from "retell-client-js-sdk";
import io from "socket.io-client"; //client

const agentId = process.env.REACT_APP_AGENT_ID || "fd4f785b0611fc2aa5cf034518a07fcc"; // Make this come from .env

interface RegisterCallResponse {
  access_token?: string;
}

const webClient = new RetellWebClient();
const socket = io('https://49d4-73-220-38-45.ngrok-free.app/'); // Update this with your actual middleware server address

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);

  // Initialize the SDK
  useEffect(() => {
    // Setup event listeners
    webClient.on("call_started", () => {
      console.log("call_started");
    });

    webClient.on("audio", (audio: Uint8Array) => {
      console.log("There is audio");
    });

    webClient.on("call_ended", ({ code, reason }) => {
      console.log("Closed with code:", code, ", reason:", reason);
      setIsCalling(false); // Update button to "Start" when call ends
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      setIsCalling(false); // Update button to "Start" in case of error
    });

    webClient.on("update", (update) => {
      // Print live transcript as needed
      console.log("update", update);
    });

    // WebSocket event listener
    socket.on('transcript', (transcript: string) => {
      setTranscripts(prevTranscripts => [...prevTranscripts, transcript]);
    });

    return () => {
      socket.off('transcript');
    };
  }, []);

  const toggleConversation = async () => {
    if (isCalling) {
      webClient.stopCall();
    } else {
      const registerCallResponse = await registerCall(agentId);
      if (registerCallResponse.access_token) {
        webClient
          .startCall({
            accessToken: registerCallResponse.access_token,
            // enableUpdate: true,
          })
          .catch(console.error);
        setIsCalling(true); // Update button to "Stop" when call starts
      }
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      // Replace with your server URL
      const response = await fetch(
        "https://49d4-73-220-38-45.ngrok-free.app/register-call-on-your-server",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: agentId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: RegisterCallResponse = await response.json();
      return data;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={toggleConversation}>
          {isCalling ? "Stop" : "Start"}
        </button>
      </header>
      <div className="chat-container">
        <div className="chat-box">
          {transcripts.map((transcript, index) => (
            <div key={index} className="chat-message">
              {transcript}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
