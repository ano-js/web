const fs = require("fs");
const path = require("path");
const express = require("express");
const mongodb = require("mongodb");
const axios = require("axios");

app = express();

// Setting JSON parsing methods for POST request data
app.use(express.urlencoded()); // HTML forms
app.use(express.json()); // API clients

// Setting view rendering engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'))
app.engine('html', require('ejs').renderFile);

// Initializing all block elements
// ORDER: imports, navbar, footer
let blockElementsNames = ["imports", "navbar", "footer"];
let blockElements = [];
for (var i = 0; i < blockElementsNames.length; i++) {
  fs.readFile(__dirname + `/blocks/${blockElementsNames[i]}.html`, "utf-8", (err, data) => {
    if (err) throw err;

    blockElements.push(data);
  });
}


// URL Routes
app.get("/", (req, res) => {
  res.render("index.html", context={
    blockElements,
  });
});


// Configuring server for listening
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[+] Node.js server listening on port ${port}`);
});
