import React, { useState } from "react";
import "./App.css";
import { google } from "googleapis";
import google_json from "../google_secret.json";
import { OAuth2Client } from "google-auth-library";

// import readline from "readline";
// import fs from "fs";
const fs = require('fs');
const readline = require('readline');

type GoogleType = typeof google_json;
function App() {
  const [list, setList] = useState("testtest");
  const TOKEN_PATH = "../token.json";
  const SCOPES = ["https://www.googleapis.com/auth/drive"];

  let drive;
  const handleStartClick = () => {
    fs.readFile("google_secret", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content.toString()), listFiles);
    });
  };
  const authorize = (credentials: GoogleType, callback: Function) => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    debugger
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token.toString()));
      callback(oAuth2Client);
    });
  };

  const listFiles = (auth: OAuth2Client) => {
    drive = google.drive({ version: "v3", auth });
    drive.files.list(
      {
        pageSize: 10,
        fields: "nextPageToken, files(id, name)",
      },
      (err, res) => {
        if (err) return console.log("The API returned an error: " + err);
        if (res) {
          const files = res.data.files;
          if (files?.length) {
            setList(files.toString());
            // console.log("Files:");
            // files.map((file) => {
            //   console.log(`${file.name} (${file.id})`);
            // });
            // downloadFile(files[0].id);
          } else {
            console.log("No files found.");
          }
        }
      }
    );
  };

  const getAccessToken = (oAuth2Client: OAuth2Client, callback: Function) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("Error retrieving access token", err);
        if (token) {
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log("Token stored to", TOKEN_PATH);
          });
          callback(oAuth2Client);
        }
      });
    });
  };

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#8f8",
        }}
      >
        <button onClick={handleStartClick}>{"start"}</button>
        <textarea>{list}</textarea>
      </div>
    </div>
  );
}

export default App;
