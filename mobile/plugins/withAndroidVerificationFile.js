// mobile/plugins/withAndroidVerificationFile.js
// Expo config plugin that copies adi-registration.properties into the
// Android app's native assets folder so Google can verify package ownership.

const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withAndroidVerificationFile(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const src = path.join(projectRoot, "android-assets", "adi-registration.properties");
      const destDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "assets"
      );
      const dest = path.join(destDir, "adi-registration.properties");

      if (!fs.existsSync(src)) {
        throw new Error(
          `[withAndroidVerificationFile] Missing source file at ${src}`
        );
      }
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
      return cfg;
    },
  ]);
};
