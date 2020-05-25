const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { animationModel, animationCounterModel, contactModel, contributorModel } = require('../mongoose');
const { sendEmail, storeAnimationRepoData, storeContributorRepoData } = require("../background-functions");
const { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink } = require("../variables");

module.exports = function(app, blockElements) {
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

      // ADDING USE TO ANIMATION
      // FORMATTING FILENAME INTO IDNAME
      let animationIdName = animationFileName.split(".")[0];
      animationIdName = animationIdName.split("-");
      animationIdName.shift();
      animationIdName = animationIdName.join("-");

      // MAKING POST REQUEST TO ADD USE TO ANIMATION
      fetch(`http://${req.headers.host}/app/add-use-to-animation?animationIdName=${animationIdName}`, {
        method: "POST"
      });

      res.send(animationFileContent);
    });
  });
}
