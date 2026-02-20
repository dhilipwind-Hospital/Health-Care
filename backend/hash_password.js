const bcrypt = require('bcryptjs');
const password = 'Pharmacist@123';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(hash);
