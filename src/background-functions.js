const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { animationModel, animationCounterModel, contactModel, contributorModel } = require('./mongoose');
const { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink } = require("./variables");

const sendEmail = async (from, to, subject, text) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS
    }
  });

  let info = await transporter.sendMail({ from, to, subject, text }, (err, info) => { if (err) throw err; });
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

const storeContributorRepoData = () => {
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

module.exports = { sendEmail, storeAnimationRepoData, storeContributorRepoData }
