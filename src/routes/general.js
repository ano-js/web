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

  app.get("/", (req, res) => {
    res.render("index.html");
  });

  app.get("/faq", (req, res) => {
    res.render("faq.html");
  })

  app.route("/join-us")
    .get((req, res) => {
      res.render("join-us.html", context={ alert: undefined });
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
      const text = "Thank you for joining Ano.js as an open source contributor!\n\nOur team uses Discord to communicate and discuss different topics, and we'd love to have you there! Please join the server by clicking on the link below:\n\n" + discordInviteLink;
      sendEmail("anojs.team@gmail.com", email, "Ano.js Discord Invite", text);

      // Saving to database
      const newContact = new contactModel({
        email, githubUsername
      });
      newContact.save((err, newContact) => { if (err) throw err; });

      // Re-rendering page with success message
      res.render("join-us.html", context={
        alert: `Check your email! Discord and GitHub invites sent to ${githubUsername}!`
      });
    });

  app.get("/our-team", (req, res) => {
    // Getting all contributors
    contributorModel.find((err, contributors) => {
      if (err) throw err;

      res.render("our-team.html", context={ contributors });
    });
  });
}
