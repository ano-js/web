const fs = require("fs");
const path = require("path");
const express = require("express");
const mongodb = require("mongodb");
const axios = require("axios");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

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
const baseCdnLink = "https://cdn.jsdelivr.net/gh/anojs/anojs-animations@master/animation-files/";
const repoDataLink = "https://api.github.com/repos/anojs/anojs-animations/contents/animation-files";
const repoCollaboratorsLink = "https://api.github.com/repos/anojs/anojs-animations/collaborators";
const repoCollaboratorInviteLink = "https://api.github.com/repos/anojs/anojs-animations/collaborators/";
const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN;

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


// ROOT DIRECTORY FILE SERVING
app.use("/robots.txt", (req, res, next) => {
  res.sendFile(__dirname + "/robots.txt");
});

app.use("/sitemap.xml", (req, res, next) => {
  res.sendFile(__dirname + "/sitemap.xml");
});


// URL Routes
app.get("/", (req, res) => {
  res.render("index.html", context={ blockElements });
});

app.route("/join-us")
  .get((req, res) => {
    res.render("join-us.html", context={
      blockElements,
      alert: undefined
    });
  })
  .post((req, res) => {
    const formData = req.body;
    const email = formData.email;
    const githubUsername = formData.githubUsername;

    // Sending invite to github user
    // Not using Axios because the PUT request didn't work
    fetch(repoCollaboratorInviteLink + githubUsername + "?permission=triage", {
      method: "PUT",
      headers: {
        "Authorization": "token " + personalAccessToken,
        "Content-Length": 0
      }
    });

    // Saving to database
    MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) throw err;

      const contactCollection = client.db("anojs").collection("contacts");

      contactCollection.insertOne({
        email,
        githubUsername
      });
    })

    // Re-rendering page with success message
    res.render("join-us.html", context={
      blockElements,
      alert: `Check your email! Invite sent to ${githubUsername}!`
    });
  });

app.get("/about", (req, res) => {
  res.render("about.html", context={ blockElements });
});

app.get("/our-team", (req, res) => {
  // Getting all contributors
  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    contributorsCollection = client.db("anojs").collection("contributors");

    contributorsCollection.find({}).toArray((err, contributors) => {
      if (err) throw err;

      res.render("our-team.html", context={ blockElements, contributors });
    });
  });
});

app.get("/our-team/:username", (req, res) => {
  const githubUsername = req.params.username;

  // Grabbing user from MongoDB
  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    const contributorsCollection = client.db("anojs").collection("contributors");

    contributorsCollection.find({ login: githubUsername }).toArray((err, contributors) => {
      if (contributors.length == 0) {  // Contributor not found
        res.send("Contributor does not exist.");
      }
      else {
        const contributor = contributors[0];
        res.render("contributor.html", context={ blockElements, contributor });
      }
    });
  });
});

app.get("/faq", (req, res) => {
  res.render("faq.html", context={ blockElements });
});

app.route("/contact-us")
  .get((req, res) => {
    res.render("contact-us.html", context={ blockElements, alert: undefined });
  })
  .post(async (req, res) => {
    const formData = req.body;

    // Sending email
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS
      }
    });

    let info = await transporter.sendMail({
      from: formData.email,
      to: "calix.huang1@gmail.com",
      subject: "Ano.js - Contact us from " + formData.name,
      text: formData.message
    });

    res.render("contact-us.html", context={ blockElements, alert: "Email successfully sent!" });
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

app.get("/animations/:animationIdName", (req, res) => {
  const animationIdName = req.params.animationIdName;

  // Grabbing animation inside of URL extension
  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    const animationsCollection = client.db("anojs").collection("animations");

    animationsCollection.find({ idName: animationIdName }).toArray((err, animations) => {
      if (err) throw err;

      if (animations.length == 0) {  // Animation not found
        res.send("No such animation exists.");
      }
      else {
        const animation = animations[0];
        res.render("animation.html", context={ animation, blockElements });
      }
    });
  });
});

app.get("/staff-positions", (req, res) => {
  // Gathering all staff positions from DB
  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    const positionCollection = client.db("anojs").collection("positions");

    positionCollection.find({}).toArray((err, positions) => {
      if (err) throw err;

      res.render("staff-positions.html", context={ blockElements, positions });
    });
  });
});

app.get("/staff-positions/tips-on-staff-positions", (req, res) => {
  res.render("tips-on-staff-positions.html", context={ blockElements });
});

app.get("/staff-positions/:idName", (req, res) => {
  const idName = req.params.idName;

  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    const positionCollection = client.db("anojs").collection("positions");

    positionCollection.find({ idName }).toArray((err, positions) => {
      if (err) throw err;

      if (positions.length == 0) {  // Position doesn't exist
        res.send("That staff position does not exist.")
      }
      else {
        res.render("staff-position.html", context={ blockElements, position: positions[0] });
      }
    });
  });
});

app.get("/terms-and-conditions", (req, res) => {
  res.render("terms_and_conditions.html", context={ blockElements });
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy_policy.html", context={ blockElements });
});


// BACKGROUND APPLICATION FUNCTIONS
const storeAnimationRepoData = (req, res) => {
  console.log("[+] storeAnimationRepoData background process running...");
  // Inserting GitHub animations repo data into MongoDB
  let animationFilesData = [];
  axios.get(repoDataLink).then((response) => {
    const fileObjects = response.data;

    // Filtering JSON response for useful data
    // Including name, idName, cdnLink, videoLink
    for (animationFile of fileObjects) {
      const animationFileName = animationFile.name;

      // Formatting name
      // Splitting filename on "-"
      const splitFileName = animationFileName.split("-");

      // Removing "anojs" from filename list
      splitFileName.shift();

      // Formatting idName
      let idName = splitFileName.join("-");
      idName = idName.substring(0, idName.length - 3)

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
        idName,
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
}

const storeCollaboratorRepoData = (req, res) => {
  console.log("[+] storeCollaboratorRepoData background process running...");

  axios.get(repoCollaboratorsLink, {
    headers: {
      "Authorization": "token " + personalAccessToken
    }
  }).then((response) => {

    const contributors = response.data;

    // Saving all contributors in MongoDB
    MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) throw err;

      const contributorsCollection = client.db("anojs").collection("contributors");

      // Clearing out collection
      contributorsCollection.drop((err, deleteConfirmation) => {
        if (err) throw err;
        if (deleteConfirmation) console.log("Collection cleared");
      });

      // Inserting all contributors
      contributorsCollection.insertMany(contributors);
    });

  }).catch((err) => {
    console.error(err);
  });

  res.status(200).send();
}


// BACKGROUND APPLICATION TASKS
// Stores all animation file data
app.get("/app/store-animation-repo-data", storeAnimationRepoData);

// Stores all repo contributor data
app.get("/app/store-contributor-repo-data", storeCollaboratorRepoData);

// Running background tasks
setInterval(storeAnimationRepoData, 3.6e+6);  // Every 1 hour
setInterval(storeCollaboratorRepoData, 3.6e+6);  // Every 1 hour


// Error routes

// Handle 404
app.get("*", (req, res) => {
  res.render("404.html", context={ blockElements });
});


// Configuring server for listening
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[+] Node.js server listening on port ${port}`);
});
