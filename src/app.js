const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { animationModel, animationCounterModel, contactModel, contributorModel } = require('./mongoose');
const { sendEmail, storeAnimationRepoData, storeContributorRepoData } = require("./background-functions");
const { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink } = require("./variables");

app = express();

// Mongoose configuration
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/anojs";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Setting JSON parsing methods for POST request data
app.use(express.urlencoded()); // HTML forms
app.use(express.json()); // API clients

// Setting view rendering engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'))
app.engine('html', require('ejs').renderFile);

// URL ROUTES
require("./routes/general")(app);
require("./routes/animations")(app);
require("./routes/legal")(app);
// require("./routes/api")(app);

// BACKGROUND APPLICATION TASKS
app.get("/app/store-animation-repo-data", (req, res) => {
  storeAnimationRepoData();
  res.send("Ano.js animations successfully scraped and stored!");
});

app.get("/app/store-contributor-repo-data", (req, res) => {
  storeContributorRepoData();
  res.send("Ano.js contributors successfully scraped and stored!");
});


// ERROR ROUTES
app.get("*", (req, res) => {
  res.render("404.html");
});


// CONFIGURE SERVER FOR LISTENING
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[+] Ano.js server listening on port ${port}`);
});
