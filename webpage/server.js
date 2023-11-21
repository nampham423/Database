const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbConfig = {
    user: 'YOUR_DB_USERNAME',
    password: 'YOUR_DB_PASSWORD',
    connectString: 'YOUR_DB_CONNECTION_STRING' 
};

app.post('/add_patient', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `INSERT INTO Patient(phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES (:phone_number, :Fname, :Lname, :gender, TO_DATE(:DOB, 'YYYY-MM-DD'), :address, :OP_flag, :IP_flag)`, {
                phone_number: req.body.phone_number,
                Fname: req.body.p_fname,
                Lname: req.body.p_lname,
                gender: req.body.gender,
                DOB: req.body.dob,
                address: req.body.address,
                OP_flag: req.body.op_id === 'Yes' ? 'Y' : 'N', // Assuming checkbox value 'Yes' for checked
                IP_flag: req.body.ip_id === 'Yes' ? 'Y' : 'N'  // and 'No' for unchecked
            },
            { autoCommit: true }
        );
        res.status(200).json({ message: "Patient added successfully", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error adding patient", err });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
