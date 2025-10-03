const bcrypt = require("bcryptjs");

const password = "fre123"; // change this to the password you want to hash

bcrypt.hash(password, 12).then(hash => {
    console.log("Hashed password:", hash);
});