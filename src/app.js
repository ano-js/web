const fs = require("fs");
const path = require("path");
const express = require("express");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const axios = require("axios");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

app = express();

// MongoDB configuration
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/anojs";

// Mongoose configuration
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
const animationModel = mongoose.model("Animation", new mongoose.Schema({
  name: String,
  idName: String,
  cdnLink: String,
  imageLink: String,
  animationContributor: String,
  animationParameters: Array,
  useCounter: Number
}));

const animationCounterModel = mongoose.model("AnimationCounter", new mongoose.Schema({
  idName: String,
  counter: Number
}));

const contactModel = mongoose.model("Contact", new mongoose.Schema({
  email: String,
  githubUsername: String
}));

const contributorModel = mongoose.model("Contributor", new mongoose.Schema({
  login: String,
  id: Number,
  node_id: String,
  avatar_url: String,
  gravatar_id: String,
  url: String,
  html_url: String,
  followers_url: String,
  gists_url: String,
  starred_url: String,
  subscriptions_url: String,
  organizations_url: String,
  repos_url: String,
  events_url: String,
  received_events_url: String,
  type: String,
  site_admin: Boolean,
  permissions: Object
}));

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
const baseCdnLink = "https://cdn.jsdelivr.net/gh/launch-tech-llc/anojs@latest/animation-files/";
const baseApiFileLink = "http://anojs.com/files/";
const baseImageLink = "https://cdn.jsdelivr.net/gh/launch-tech-llc/anojs@latest/animation-images/";
const repoDataLink = "https://api.github.com/repos/launch-tech-llc/anojs/contents/animation-files";
const repoCollaboratorsLink = "https://api.github.com/repos/launch-tech-llc/anojs/collaborators?page=";
const repoCollaboratorInviteLink = "https://api.github.com/repos/launch-tech-llc/anojs/collaborators/";
const repoCommitsLink = "https://api.github.com/repos/launch-tech-llc/anojs/stats/contributors";
const slackInviteLink = `https://slack.com/api/users.admin.invite?token=${slackLegacyToken}&channels=general,github-updates,help,networking,welcome,announcements&email=`;
const discordInviteLink = "https://discord.gg/xkdRm7E";
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

    // Sending email with Discord invite to the email
    // const text = "Thank you for joining Ano.js as an open source contributor!\n\nOur team uses Discord to communicate and discuss different topics, and we'd love to have you there! Please join the server by clicking on the link below:\n\n" + discordInviteLink;
    // sendEmail("anojs.team@gmail.com", email, "Ano.js Discord Invite", text);

    // Saving to database
    const newContact = new contactModel({
      email, githubUsername
    });
    newContact.save((err, newContact) => {
      if (err) throw err;
      console.log(newContact);
     });

    // Re-rendering page with success message
    res.render("join-us.html", context={
      blockElements,
      alert: `Check your email! Discord and GitHub invites sent to ${githubUsername}!`
    });
  });

app.get("/our-team", (req, res) => {
  // Getting all contributors
  contributorModel.find((err, contributors) => {
    if (err) throw err;

    res.render("our-team.html", context={ blockElements, contributors });
  });
});

app.get("/our-team/:username", (req, res) => {
  const githubUsername = req.params.username;

  // Getting specific contributor
  contributorModel.findOne({ login: githubUsername }, (err, contributor) => {
    if (err) throw err;

    if (contributor) {
      res.render("contributor.html", context={ blockElements, contributor });
    }
    else { // Contributor not found
      res.send("Contributor does not exist.");
    }
  });
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
      to: "anojs@launchtechllc.com",
      subject: "Ano.js - Contact us from " + formData.name,
      text: formData.message
    });

    res.render("contact-us.html", context={ blockElements, alert: "Email successfully sent!" });
  });

app.get("/animations", (req, res) => {
  // Grabbing all animation repo data from MongoDB
  animationModel.find((err, animations) => {
    if (err) throw err;

    // Sorting animations based on uses
    animations.sort((a, b) => (a.useCounter > b.useCounter) ? -1 : 1);

    res.render("animations.html", context={
      blockElements,
      animations
    });
  });
});

app.get("/animations/:animationIdName", (req, res) => {
  const animationIdName = req.params.animationIdName;

  // Grabbing animation inside of URL extension
  animationModel.findOne({ idName: animationIdName }, (err, animation) => {
    if (err) throw err;

    if (animation) {
      res.render("animation.html", context={ animation, blockElements });
    } else {  // Animation not found
      res.send("No such animation exists.");
    }
  });
});

app.get("/terms-and-conditions", (req, res) => {
  res.render("terms_and_conditions.html", context={ blockElements });
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy_policy.html", context={ blockElements });
});

app.get("/credits", (req, res) => {
  res.render("credits.html", context={ blockElements });
});


// API VIEWS
app.post("/app/add-use-to-animation", (req, res) => {
  const animationIdName = req.query.animationIdName;

  mongoose.set('useFindAndModify', false);

  // Update animationCounter
  animationCounterModel.findOneAndUpdate(
    { idName: animationIdName },
    { $inc: { counter: 1 } },
    { new: true },
    (err, animationCounter) => {
      if (err) throw err;
    }
  );

  res.status(200).send();
});


// FILE API
app.get("/files/:animationFileName", (req, res) => {
  // Setting matching object
  const matcher = req.query;

  // Gets filename passed in
  const animationFileName = req.params.animationFileName;

  // Grabbing file contents from jsDelivr
  fetch(baseCdnLink + animationFileName, {
    method: "GET"
  }).then((response) => {
    return response.text();
  }).then((animationFileContent) => {
    // Replacing file contents with query parameters
    for (match of Object.entries(matcher)) {
      animationFileContent = animationFileContent.replace(match[0], match[1])
    }

    res.send(animationFileContent);
  });
})


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

const storeAnimationRepoData = () => {
  // Inserting GitHub animations repo data into MongoDB
  axios.get(repoDataLink).then((response) => {
    var animationFilesData = [];
    const fileObjects = response.data;
    let idNames = [];

    // Drop all animations
    animationModel.deleteMany({}, (err) => { if (err) throw err; });

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
        const cdnLink = baseApiFileLink + animationFileName;

        // Formatting image filename
        const imageLink = baseImageLink + "anojs-" + idName + ".png";

        // Getting all custom API parameters
        // Grabbing file contents
        fetch(baseCdnLink + animationFileName, {
          method: "GET"
        }).then((response) => {
          return response.text();
        }).then((animationFileContent) => {
          const regex = /(?<!\w)ANOJS_\w+/g;
          var match;
          var animationParameters = []
          while ((match = regex.exec(animationFileContent)) != null) {
            animationParameters.push(match);
          }

          let found = false;

          animationCounterModel.find((err, animationCounters) => {
            for (animationCounter of animationCounters) {
              if (animationCounter.idName == idName) {
                found = true;
                const newAnimation = animationModel({
                  name,
                  idName,
                  cdnLink,
                  imageLink,
                  animationContributor,
                  animationParameters,
                  useCounter: animationCounter.counter
                });
                newAnimation.save((err, newAnimation) => { if (err) throw err; });
                break;
              }
            }

            if (!found) {
              console.log("not found");
              const newAnimationCounter = new animationCounterModel({
                idName,
                counter: 0
              });
              newAnimationCounter.save((err, newAnimationCounter) => { if (err) throw err; });

              const newAnimation = new animationModel({
                name,
                idName,
                cdnLink,
                imageLink,
                animationContributor,
                animationParameters,
                useCounter: 0
              });
              newAnimation.save((err, newAnimation) => { if (err) throw err; });
            }
          });
        });
      });
    }
  }).catch((err) => {
    console.error(err);
  });
}

const storeCollaboratorRepoData = () => {
  // Getting all commit data
  axios.get(repoCommitsLink).then(async (response) => {
    const commitData = response.data;

    let contributors = [];
    let pageNumber = 1;
    let lastResponse = 1;
    for (i = 0; i < 10; i++) {
      await axios.get(repoCollaboratorsLink + (i+1).toString(), {
        headers: {
          "Authorization": "token " + personalAccessToken
        }
      }).then((response) => {
        for (contributor of response.data) {
          contributors.push(contributor);
        }

        pageNumber++;
      }).catch((err) => {
        console.error(err);
      });
    }

    for (var i = 0; i < contributors.length; i++) {
      let contributionCounter = 0;
      for (commit of commitData) {
        if (commit.author.login == contributors[i].login) {   // Contribution was from current contributor
          contributionCounter += 1;
        }
      }

      contributors[i].contributionCounter = contributionCounter;
    }

    // Sorting array based on contributionCounter
    contributors.sort((a, b) => (a.contributionCounter > b.contributionCounter) ? -1 : 1);

    animationModel.find((err, animations) => {
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
      // Drop all animations
      contributorModel.deleteMany({}, (err) => { if (err) throw err; });

      // Inserting all contributors
      contributorModel.insertMany(contributors, (err, contributors) => { if (err) throw err; })
    });
  });
}


// BACKGROUND APPLICATION TASKS
// Stores all animation file data
app.get("/app/store-animation-repo-data", (req, res) => {
  storeAnimationRepoData();
  res.send("done!");
});

// Stores all repo contributor data
app.get("/app/store-contributor-repo-data", (req, res) => {
  storeCollaboratorRepoData();
  res.send("done!");
});


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

  res.status(200).send();
})


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
