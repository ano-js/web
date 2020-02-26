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


// URL Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});


// Configuring server for listening
const port = 3000 || process.ENV.PORT;
app.listen(port, () => {
  console.log(`[+] Node.js server listening on port ${port}`);
});
