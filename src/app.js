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
const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN;
const slackLegacyToken = process.env.SLACK_LEGACY_TOKEN;
const slackHelpBotAuthToken = "xoxb-962839993154-1039500909904-5xfhZGqIlVXTsyJOTcWsrNLL";
const slackSendMessageLink = `https://slack.com/api/chat.postMessage?token=${slackHelpBotAuthToken}&channel=`;
const baseCdnLink = "https://cdn.jsdelivr.net/gh/anojs/anojs@latest/animation-files/";
const baseImageLink = "https://cdn.jsdelivr.net/gh/anojs/anojs@latest/animation-images/";
const repoDataLink = "https://api.github.com/repos/anojs/anojs/contents/animation-files";
const repoCollaboratorsLink = "https://api.github.com/repos/anojs/anojs/collaborators";
const repoCollaboratorInviteLink = "https://api.github.com/repos/anojs/anojs/collaborators/";
const repoCommitsLink = "https://api.github.com/repos/anojs/anojs/stats/contributors";
const slackInviteLink = `https://slack.com/api/users.admin.invite?token=${slackLegacyToken}&channels=general,github-updates,help,networking,welcome,announcements&email=`;
const baseFireBaseLink = "https://anojs-2c1b8.firebaseio.com/";

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

    // Sending Slack invite to user
    fetch(slackInviteLink + email, {
      method: "GET"
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
      alert: `Check your email! Slack and GitHub invites sent to ${githubUsername}!`
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

  MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) throw err;

    const db = client.db("anojs");

    // Grabbing contributor from MongoDB
    const contributorsCollection = db.collection("contributors");

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
      to: "anojs.team@gmail.com",
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

    animationsCollection.find({}).toArray((err, animations) => {
      if (err) throw err;

      // Sorting animations based on uses
      animations.sort((a, b) => (a.useCounter > b.useCounter) ? -1 : 1);

      res.render("animations.html", context={
        blockElements,
        animations
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


// API VIEWS
app.post("/app/add-use-to-animation", (req, res) => {
  const animationIdName = req.query.animationIdName;

  // Add to animation-counters collection
  fetch(baseFireBaseLink + "animationCounters.json", {
    method: "GET"
  }).then((response) => {
    return response.json()
  }).then((data) => {
    for (animationCounterObject of Object.entries(data)) {
      const animationCounterObjectId = animationCounterObject[0];
      const animationCounter = animationCounterObject[1];
      if (animationCounter.idName == animationIdName) {
        // DELETING OLD RECORD
        fetch(baseFireBaseLink + "animationCounters/" + animationCounterObjectId + ".json", {
          method: "DELETE"
        });

        // ADDDING NEW RECORD
        fetch(baseFireBaseLink + "animationCounters.json", {
          method: "POST",
          body: JSON.stringify({
            idName: animationIdName,
            useCounter: animationCounter.useCounter + 1
          })
        });
        break;
      }
    }
  });

  res.status(200).send();
});


// BACKGROUND APPLICATION FUNCTIONS
const sendEmail = async (from, to, subject, text) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS
    }
  });

  let info = await transporter.sendMail({
    from,
    to,
    subject,
    text
  });
}

const storeRepoData = () => {
  // STORING ANIMATION REPO DATA
  // Inserting GitHub animations repo data into MongoDB
  axios.get(repoDataLink).then((response) => {
    let animationFilesData = [];
    const fileObjects = response.data;
    let idNames = [];

    // Filtering JSON response for useful data
    // Including name, idName, cdnLink, videoLink
    for (animationFile of fileObjects) {
      const animationFileName = animationFile.name;

      // Getting file contributor
      fetch(baseCdnLink + animationFileName, {
        method: "GET"
      }).then((response) => {
        return response.text();
      }).then((text) => {
        const firstLine = text.split("\n")[0];
        const animationContributor = firstLine.substring(3);

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
        const imageLink = baseImageLink + "anojs-" + idName + ".png";

        idNames.push(idName);

        animationFilesData.push({
          name,
          idName,
          cdnLink,
          imageLink,
          animationContributor
        });
      });
    }

    // Gathering all data from Firebase
    fetch(baseFireBaseLink + "animationCounters.json", {
      method: "GET"
    }).then((response) => {
      return response.json();
    }).then((data) => {
      // There are values inside of Firebase
      if (data) {
        // Creating array of Firebase animationCounters
        let firebaseIdNames = [];
        let firebaseObjects = [];
        for (firebaseObject of Object.values(data)) {
          firebaseIdNames.push(firebaseObject.idName);
          firebaseObjects.push(firebaseObject);
        }

        for (idName of idNames) {
          if (!firebaseIdNames.includes(idName)) {  // Firebase doesn't have this animation
            // Creating record on Firebase
            fetch(baseFireBaseLink + "animationCounters.json", {
              method: "POST",
              body: JSON.stringify({
                idName,
                useCounter: 0
              })
            });
          }
        }
      }
      // No values inside of Firebase
      // Input all animation data points by default
      else {
        for (idName of idNames) {
          // Creating record on Firebase
          fetch(baseFireBaseLink + "animationCounters.json", {
            method: "POST",
            body: JSON.stringify({
              idName,
              useCounter: 0
            })
          });
        }
      }
    });

    MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) throw err;

      // Gathering Firebase objects
      fetch(baseFireBaseLink + "animationCounters.json", {
        method: "GET"
      }).then((response) => {
        return response.json();
      }).then((data) => {
        let firebaseObjects = [];
        for (firebaseObject of Object.values(data)) {
          firebaseObjects.push(firebaseObject);
        }

        // Adding updated animationCounters to animationFilesData
        for (var i = 0; i < animationFilesData.length; i++) {
          for (firebaseObject of firebaseObjects) {
            if (firebaseObject.idName == animationFilesData[i].idName) {
              animationFilesData[i].useCounter = firebaseObject.useCounter;
            }
          }
        }

        const animationsCollection = client.db("anojs").collection("animations");

        // Clearing out entire collection
        animationsCollection.drop((err, deleteConfirmation) => {
          if (err) throw err;
          if (deleteConfirmation) console.log("Collection cleared");
        });

        // Inserting all animations into collection
        animationsCollection.insertMany(animationFilesData);
      });
    });
  }).catch((err) => {
    console.error(err);
  });


  // STORING CONTRIBUTOR DATA
  // Getting all commit data
  axios.get(repoCommitsLink).then((response) => {
    const commitData = response.data;

    axios.get(repoCollaboratorsLink, {
      headers: {
        "Authorization": "token " + personalAccessToken
      }
    }).then((response) => {

      const contributors = response.data;

      for (var i = 0; i < contributors.length; i++) {
        let contributionCounter;
        for (commit of commitData) {
          if (commit.author.login == contributors[i].login) {   // Contribution was from current contributor
            contributionCounter = commit.total;
            break;
          }
        }

        // Contributor has no commits
        if (!contributionCounter) {
          contributors[i].contributionCounter = 0;
        } else {
          contributors[i].contributionCounter = contributionCounter;
        }
      }

      // Sorting array based on contributionCounter
      contributors.sort((a, b) => (a.contributionCounter > b.contributionCounter) ? -1 : 1);

      MongoClient.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, (err, client) => {
        if (err) throw err;

        const db = client.db("anojs");

        // Grabbing all contributor's animatons from MongoDB
        const animationsCollection = db.collection("animations");

        animationsCollection.find({}).toArray((err, animations) => {
          if (err) throw err;

          // Attaching each animation appropriate to each contributor
          for (var i = 0; i < contributors.length; i++) {
            let contributorAnimations = [];

            for (animation of animations) {
              if (animation.animationContributor == contributors[i].login) {
                contributorAnimations.push(animation);
              }
            }

            // Adding animations to contributor
            contributors[i].animations = contributorAnimations;

            // Adding number of animations to contributor
            contributors[i].numberOfAnimations = contributorAnimations.length;
          }

          // Saving all contributors in MongoDB
          const contributorsCollection = db.collection("contributors");

          // Clearing out collection
          contributorsCollection.drop((err, deleteConfirmation) => {
            if (err) throw err;
            if (deleteConfirmation) console.log("Collection cleared");
          });

          // Inserting all contributors
          contributorsCollection.insertMany(contributors);
        });
      });

    }).catch((err) => {
      console.error(err);
    });
  });
}

// Slack webhook
// User joins workspace -> Slackbot sends them a message
app.post("/app/user-join", (req, res) => {
  const slackIncomingData = req.body;

  const text = "hi";
  console.log("user join");

  fetch(slackSendMessageLink + slackIncomingData.user + "&text=" + text, {
    method: "GET"
  }).then((response) => {
    console.log(response);
  });
})


// BACKGROUND APPLICATION TASKS
// Stores all animation file data
app.get("/app/store-repo-data", (req, res) => {
  storeRepoData();
});

// Running background tasks
setInterval(storeRepoData, 3600000);  // Every 1 hour


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
