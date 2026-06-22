const paperbackLogo = "https://paperback.moe/icons/logo-alt.svg";
const guideUrl = "https://paperback.moe/help/guides/adding-repos/";

export function renderRepositoryPage({
  title,
  description,
  repositoryDescription,
  baseUrl,
  sources
}) {
  const addRepoUrl = `paperback://addRepo?displayName=${encodeURIComponent(title)}&url=${encodeURIComponent(baseUrl)}`;
  const sourceItems = sources
    .map((source) => {
      const badges = (source.badges ?? [])
        .map((badge) => renderBadge(badge.label ?? badge.text, badge.type))
        .join("");
      return `<li>${escapeHtml(source.name)}${badges}</li>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="robots" content="noindex">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="${paperbackLogo}">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <header>
    <img class="icon" src="${paperbackLogo}" alt="Repository logo">
    <h1>${escapeHtml(title)}</h1>
    <p class="pageDescription">${escapeHtml(description)}</p>
    <a class="addToPaperbackButton" href="${addRepoUrl}">Add to Paperback</a>
  </header>
  <main class="content">
    <p id="repositoryDescription">${escapeHtml(repositoryDescription)}</p>
    <blockquote>
      <p>A guide is available to learn everything about extensions repositories.</p>
      <p>Check it <a href="${guideUrl}">here</a> to learn how to add and use this repository in Paperback.</p>
    </blockquote>
    <blockquote>
      <p><span>On a Paperback installed device, press </span><a href="${addRepoUrl}">Add to Paperback</a><span> or use the base URL to add this repository to the app.</span></p>
    </blockquote>
    <section class="baseUrl">
      <p class="title">Base URL:</p>
      <p>${escapeHtml(baseUrl)}</p>
    </section>
    <section class="availableSources">
      <p class="title">Available Sources:</p>
      <div id="listDiv">
        <ul>${sourceItems}</ul>
      </div>
    </section>
  </main>
</body>
</html>
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  padding: 3.6rem 2rem 1.5rem;
  text-align: center;
}
.title {
  font-weight: 700;
  margin-bottom: 8px;
}
.icon {
  max-height: 8rem;
}
h1 {
  font-size: 1.7rem;
  margin: 1rem auto;
}
.pageDescription {
  max-width: 35rem;
  font-size: 1.3rem;
  line-height: 1.3;
  color: #6a8bad;
  margin: 1rem auto;
}
.addToPaperbackButton {
  display: inline-block;
  width: 10rem;
  line-height: 1.7;
  margin: .25rem;
  padding: .4rem;
  color: #fff;
  background-color: #2e84bf;
  border-bottom: 1px solid #2977ac;
  border-radius: 4px;
  transition: background-color .1s ease;
}
.addToPaperbackButton:hover {
  background-color: #3992cf;
  text-decoration: none;
}
.content {
  margin: auto;
  max-width: 920px;
  text-align: left;
}
blockquote {
  font-size: 0.9rem;
  color: #777;
  border-left: .2rem solid #dfe2e5;
  margin: 1rem 0;
  padding: .25rem 0 .25rem 1rem;
  line-height: 1.6;
}
blockquote p {
  margin-top: 2px;
  margin-bottom: 2px;
}
a:hover {
  text-decoration: underline;
}
a {
  font-weight: 500;
  text-decoration: none;
  color: #2196f3;
}
.baseUrl {
  background-color: #f0f4f8;
  border-radius: .4rem;
  padding: .1rem .1rem;
}
.baseUrl p {
  margin-left: 16px;
}
ul {
  margin-top: 0;
}
#listDiv {
  line-height: 1.5;
}
.el-tag {
  margin-left: 4px;
  margin-right: 2px;
  background-color: #ecf5ff;
  display: inline-block;
  height: 32px;
  padding: 0 10px;
  line-height: 30px;
  font-size: 12px;
  color: #409eff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  box-sizing: border-box;
  white-space: nowrap;
}
.el-tag--dark {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}
.el-tag--mini {
  height: 20px;
  padding: 0 5px;
  line-height: 19px;
}
.el-tag--dark.el-tag--success {
  background-color: #67c23a;
  border-color: #67c23a;
}
.el-tag--dark.el-tag--info {
  background-color: #909399;
  border-color: #909399;
}
.el-tag--dark.el-tag--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
}
.el-tag--dark.el-tag--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
}
</style>`;
}

function renderBadge(text, type = "info") {
  const normalizedType = type === "warning" || type === "danger" || type === "success"
    ? type
    : "info";
  return `<span class="el-tag el-tag--dark el-tag--mini el-tag--${normalizedType}">${escapeHtml(text)}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
