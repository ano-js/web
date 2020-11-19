const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN || "a5c14043c1f5f64689cb5b2a55d1f867b87d8ab4";
const baseCdnLink = "https://cdn.jsdelivr.net/gh/calixo888/anojs@latest/animation-files/";
const baseApiFileLink = "https://anojs.com/files/";
const baseImageLink = "https://cdn.jsdelivr.net/gh/calixo888/anojs@latest/animation-images/";
const repoDataLink = "https://api.github.com/repos/calixo888/anojs/contents/animation-files";
const repoContributorsLink = "https://api.github.com/repos/calixo888/anojs/contributors";
const repoCollaboratorsLink = "https://api.github.com/repos/calixo888/anojs/collaborators?page=";
const repoCollaboratorInviteLink = "https://api.github.com/repos/calixo888/anojs/collaborators/";
const repoCommitsLink = "https://api.github.com/repos/calixo888/anojs/stats/contributors";
const discordInviteLink = "https://discord.gg/xkdRm7E";

module.exports = { personalAccessToken, baseCdnLink, baseApiFileLink, baseImageLink, repoDataLink, repoContributorsLink, repoCollaboratorsLink, repoCollaboratorInviteLink, repoCommitsLink, discordInviteLink };
