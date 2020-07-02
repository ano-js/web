const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN;
const baseCdnLink = "https://cdn.jsdelivr.net/gh/launch-tech-llc/anojs@latest/animation-files/";
const baseApiFileLink = "https://anojs.com/files/";
const baseImageLink = "https://cdn.jsdelivr.net/gh/launch-tech-llc/anojs@latest/animation-images/";
const repoDataLink = "https://api.github.com/repos/launch-tech-llc/anojs/contents/animation-files";
const repoCollaboratorsLink = "https://api.github.com/repos/launch-tech-llc/anojs/collaborators?page=";
const repoCollaboratorInviteLink = "https://api.github.com/repos/launch-tech-llc/anojs/collaborators/";
const repoCommitsLink = "https://api.github.com/repos/launch-tech-llc/anojs/stats/contributors";
const discordInviteLink = "https://discord.gg/xkdRm7E";

module.exports = { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink };
