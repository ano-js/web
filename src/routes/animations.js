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

  app.get("/animations", (req, res) => {
    // Grabbing all animation repo data from MongoDB
    animationModel.find((err, animations) => {
      if (err) throw err;

      // Sorting animations based on uses
      animations.sort((a, b) => (a.useCounter > b.useCounter) ? -1 : 1);

      res.render("animations.html", context={ animations });
    });
  });

  app.get("/animations/:animationIdName", (req, res) => {
    const animationIdName = req.params.animationIdName;

    // Grabbing animation inside of URL extension
    animationModel.findOne({ idName: animationIdName }, (err, animation) => {
      if (err) throw err;

      if (animation) {
        res.render("animation.html", context={ animation });
      } else {  // Animation not found
        res.send("No such animation exists.");
      }
    });
  });
}
