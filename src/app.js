const fs = require("fs");
const path = require("path");
const express = require("express");
const mongodb = require("mongodb");
const axios = require("axios");

app = express();

// MongoDB configuration
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";

// Setting JSON parsing methods for POST request data
app.use(express.urlencoded()); // HTML forms
app.use(express.json()); // API clients

// Setting view rendering engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'))
app.engine('html', require('ejs').renderFile);

// GLOBAL VARIABLES
const baseCdnLink = "https://cdn.jsdelivr.net/gh/calixo888/anojs-animations@master/animation-files/";

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
  res.render("index.html", context={ blockElements });
});

app.get("/join-us", (req, res) => {
  res.render("join-us.html", context={ blockElements });
});

app.get("/about", (req, res) => {
  res.render("about.html", context={ blockElements });
});

app.get("/our-team", (req, res) => {
  res.render("our-team.html", context={ blockElements });
});

app.get("/faq", (req, res) => {
  res.render("faq.html", context={ blockElements });
});

app.get("/contact-us", (req, res) => {
  res.render("contact-us.html", context={ blockElements });
});

app.get("/animations", (req, res) => {
  // Grabbing all animation repo data from MongoDB
  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    const animationsCollection = client.db("anojs").collection("animations");

    animationsCollection.find({}).toArray((err, animationData) => {
      if (err) throw err;

      res.render("animations.html", context={
        blockElements,
        animationData
      });
    });
  });
});


// BACKGROUND APPLICATION TASKS
app.get("/app/store-animation-repo-data", (req, res) => {
  // Inserting GitHub animations repo data into MongoDB
  let animationFilesData = [];
  axios.get("https://api.github.com/repos/calixo888/anojs-animations/contents/animation-files").then((response) => {
    const fileObjects = response.data;

    // Filtering JSON response for useful data
    // Including name, link
    for (animationFile of fileObjects) {
      const animationFileName = animationFile.name;

      // Formatting name
      // Splitting filename on "-"
      const splitFileName = animationFileName.split("-");

      // Removing "anojs" from filename list
      splitFileName.shift();

      // Pulling formatted name together
      let name = splitFileName.join(" ");

      // Getting rid of ".js" from last word
      name = name.substring(0, name.length - 3);

      // Capitalizing all words in filename
      name = name.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());

      // Formatting CDN link
      const cdnLink = baseCdnLink + animationFileName;

      // Formatting S3 video link
      const videoName = name.split(" ").join("+");
      const videoLink = `https://anojs.s3.us-east-2.amazonaws.com/${videoName}.mov`

      animationFilesData.push({
        name,
        cdnLink,
        videoLink
      })
    }

    MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) throw err;

      const animationsCollection = client.db("anojs").collection("animations");

      // Clearing out entire collection
      animationsCollection.drop((err, deleteConfirmation) => {
        if (err) throw err;
        if (deleteConfirmation) console.log("Collection cleared");
      });

      // Inserting all animations into collection
      animationsCollection.insertMany(animationFilesData);
    })
  }).catch((err) => {
    console.error(err);
  });

  res.status(200).send();
});


// Configuring server for listening
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[+] Node.js server listening on port ${port}`);
});
