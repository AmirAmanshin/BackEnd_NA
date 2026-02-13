const bcrypt = require("bcrypt");

const password = "Robin";
const SALT_ROUNDS = 10;

(async () => {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log("Password:", password);
    console.log("Hash:", hash);
  } catch (err) {
    console.error("Error:", err);
  }
})();
