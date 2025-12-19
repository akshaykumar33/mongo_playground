const pkg = require("react-resizable-panels");
console.log("Exports:", Object.keys(pkg));
try {
  const pkgJson = require("react-resizable-panels/package.json");
  console.log("Version:", pkgJson.version);
} catch (e) {
  console.log("Could not read package.json version");
}
