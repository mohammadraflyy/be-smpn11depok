const fs = require('fs');
const yaml = require('js-yaml');

let config = {};
try {
  const file = fs.readFileSync('./config.yaml', 'utf8');
  config = yaml.load(file);
} catch (e) {
  console.error("Error loading YAML config:", e);
}

module.exports = config;
