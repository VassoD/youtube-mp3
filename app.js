const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Load the search history from the JSON file
let searchHistory = [];

try {
  const searchHistoryData = fs.readFileSync(
    path.join(__dirname, "search-history.json"),
    "utf-8"
  );
  searchHistory = JSON.parse(searchHistoryData);
} catch (err) {
  console.error("Error reading search history:", err);
}

// GET route for rendering the search history
app.get("/", (req, res) => {
  res.render("index", { searchHistory });
});

// POST route
app.post("/convert-mp3", async (req, res) => {
  const videoId = req.body.videoId;

  if (videoId === undefined || videoId === "" || videoId === null) {
    return res.render("index", {
      success: false,
      message:
        "Please enter a video ID (ID starts after = in the video's link)",
    });
  } else {
    const fetchAPI = await fetch(
      `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.API_KEY,
          "x-rapidapi-host": process.env.API_HOST,
        },
      }
    );

    const fetchResponse = await fetchAPI.json();

    if (fetchResponse.status === "ok") {
      const searchEntry = {
        videoId,
        song_title: fetchResponse.title,
        song_link: fetchResponse.link,
      };

      // Add the search entry to the search history
      searchHistory.push(searchEntry);

      // Save the updated search history to the JSON file
      fs.writeFileSync(
        path.join(__dirname, "search-history.json"),
        JSON.stringify(searchHistory, null, 2),
        "utf-8"
      );

      return res.render("index", {
        success: true,
        song_title: fetchResponse.title,
        song_link: fetchResponse.link,
      });
    } else {
      return res.render("index", {
        success: false,
        message: fetchResponse.msg,
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
