const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbConfig = {
    user: 'system',
    password: 'Nam422003@',
    connectString: '192.168.85.1:1522/XEPDB1' 
};
async function testConnection() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log("Kết nối thành công!");
        // Các truy vấn khác có thể được thực hiện tại đây
    } catch (err) {
        console.error("Có lỗi xảy ra: ", err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Có lỗi khi đóng kết nối: ", err);
            }
        }
    }
}

testConnection();
//for testing the connection between database and server
app.post('/search_doctor', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM Employee WHERE Emp_id = :Emp_id AND Dr_flag = 'Y'`,
            { Emp_id: req.body.Emp_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length > 0) {
            // Doctor found
            res.json({ found: true, doctor: result.rows[0] });
        } else {
            // Doctor not found
            res.json({ found: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
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
app.post('/search_patient', async (req, res) => {
    let { ipId, opId, phoneNumber } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        let query, binds = {};

        if (ipId) {
            query = `SELECT * FROM Treatment WHERE IP_phone = :ipId`;      ///pls adjust this logic
            binds = { ipId };
        } else if (opId) {
            query = `SELECT * FROM Examination WHERE OP_phone = :opId`;
            binds = { opId };
        } else if (phoneNumber) {
            query = `SELECT * FROM Patient WHERE phone_number = :phoneNumber`;
            binds = { phoneNumber };
        } else {
            res.status(400).send({ error: 'No search parameters provided.' });
            return;
        }

        const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
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