const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN;
const baseCdnLink = "https://cdn.jsdelivr.net/gh/ano-js/anojs@latest/animation-files/";
const baseApiFileLink = "https://cdn.anojs.com/files/";
const baseImageLink = "https://cdn.jsdelivr.net/gh/ano-js/anojs@latest/animation-images/";
const repoDataLink = "https://api.github.com/repos/ano-js/anojs/contents/animation-files";
const repoContributorsLink = "https://api.github.com/repos/ano-js/anojs/contributors";
const repoCollaboratorsLink = "https://api.github.com/repos/ano-js/anojs/collaborators?page=";
const repoCollaboratorInviteLink = "https://api.github.com/repos/ano-js/anojs/collaborators/";
const repoCommitsLink = "https://api.github.com/repos/ano-js/anojs/stats/contributors";
const discordInviteLink = "https://discord.gg/xkdRm7E";

module.exports = { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoContributorsLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink };
