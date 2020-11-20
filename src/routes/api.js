const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { animationModel, animationCounterModel, contactModel, contributorModel } = require('../mongoose');
const { sendEmail, storeAnimationRepoData, storeContributorRepoData } = require("../background-functions");
const { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink } = require("../variables");

module.exports = function(app) {
  // API VIEWS
  app.post("/api/add-use-to-animation", (req, res) => {
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
}
