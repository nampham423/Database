const express = require('express');
const oracledb = require('oracledb');
const app = express();

app.use(express.json());

const dbConfig = {
    user: "your_db_username",
    password: "your_db_password",
    connectString: "your_db_connect_string"
};

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
