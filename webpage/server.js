const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.json());

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
const dbConfig = {
    user: 'hosdb',
    password: '123',
    connectString: '192.168.85.1:1522/XEPDB1' 
};

app.post('/login', async (req, res) => {
    let connection;
    const loginid = req.body;
    try {
        connection = await oracledb.getConnection(dbConfig);
        let result = await connection.execute(
            `SELECT * FROM login WHERE username = :id AND pass = :pass`,
            { 
                id: loginid.username,
                pass: loginid.password
            },
        );
        console.log("Kết quả truy vấn:", result.rows);
        if (result.rows.length > 0) {
            // Doctor found
            res.json({ found: true});
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
app.post('/add_patient', async (req, res) => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await oracledb.getConnection(dbConfig);
        console.log('Database connection successful.');

        const { phone_number, p_fname, p_lname, gender, dob, address, op_id, ip_id } = req.body;
        // In ra console các giá trị trước khi thêm vào cơ sở dữ liệu
        console.log(req.body);

        console.log('Preparing to insert patient data...');
        console.log('Phone Number:', phone_number);
        console.log('First Name:', p_fname);
        console.log('Last Name:', p_lname);
        console.log('Gender:', gender);
        console.log('DOB:', dob);
        console.log('Address:', address);
        console.log('OP ID:', op_id === 'on' ? 'Y' : 'N');
        console.log('IP ID:', ip_id === 'on' ? 'Y' : 'N');
        
        console.log('Inserting patient data into database...');
        let result = await connection.execute(
            `INSERT INTO Patient(phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES (:phone_number, :Fname, :Lname, :gender, TO_DATE(:DOB, 'YYYY-MM-DD'), :address, :OP_flag, :IP_flag)`, 
            {
                phone_number: phone_number,
                Fname: p_fname,
                Lname: p_lname,
                gender,
                DOB: dob,
                address,
                OP_flag: op_id === 'on' ? 'Y' : 'N',
                IP_flag: ip_id === 'on' ? 'Y' : 'N'
            },
            { autoCommit: true }
        );
        console.log('Patient added successfully:', result);

        result = await connection.execute(
            `SELECT * FROM Patient WHERE phone_number = :phone_number`, 
            {
                phone_number: phone_number,
            },
        );
        console.log('Patient output:', result);

        res.status(200).json({ message: "Patient added successfully", result });
    } catch (err) {
        console.error('Error during database operation:', err);
        res.status(500).json({ message: "Error adding patient", err });
    } finally {
        if (connection) {
            try {
                console.log('Closing database connection...');
                await connection.close();
                console.log('Database connection closed.');
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});
app.post('/search_doctor', async (req, res) => {
    let connection;
    const doctorId = req.body.doctorId;
    console.log('Search ID:', doctorId);
    try {
        connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            `SELECT * FROM employee WHERE emp_ID = :eID AND Dr_Flag = 'Y'`,
            { eID: doctorId },
        );

        console.log("Kết quả truy vấn:", result.rows);
        if (result.rows.length > 0) {
            // Doctor found
            res.json({ found: true});
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
app.post('/get_patient_info', async (req, res) => {
    let connection;
    try {
        console.log("Attempting database connection...");
        connection = await oracledb.getConnection(dbConfig);
        console.log("Database connected.");

        const doctorId = req.body.Dr_ID;
        console.log("Received Doctor ID:", doctorId);

        console.log("Executing PL/SQL function...");
        const result = await connection.execute(
            `BEGIN :cursor := get_patientInf_by_DrID(:Dr_id); END;`,
            {
                Dr_id: doctorId,
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const resultSet = result.outBinds.cursor;
        console.log("Fetching rows from cursor...");
        const rows = await resultSet.getRows();
        console.log("Rows fetched:", rows);

        if (rows.length > 0) {
            console.log("Patients found, sending data.");
            res.json({ found: true, patients: rows });
        } else {
            console.log("No patients found.");
            res.json({ found: false });
        }

        await resultSet.close();
        console.log("ResultSet closed.");

    } catch (err) {
        console.error("Error occurred:", err);
        console.error("Error stack:", err.stack);
        res.status(500).send({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log("Database connection closed.");
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
});

app.post('/search_patient', async (req, res) => {
    let { searchValue } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        // Query for Patient details
        let patientQuery = `SELECT * FROM Patient WHERE phone_number = :searchValue OR OP_id = :searchValue OR IP_id = :searchValue`;
        let patientResult = await connection.execute(patientQuery, { searchValue }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        // If patient exists, query for Treatment, Examination, and Admission_History
        if (patientResult.rows.length > 0) {
            let treatmentQuery = `SELECT * FROM Treatment WHERE IP_phone = :searchValue`;
            let examinationQuery = `SELECT * FROM Examination WHERE OP_phone = :searchValue`;
            let admissionHistoryQuery = `SELECT * FROM Admission_History WHERE IP_phone = :searchValue`;

            let treatmentResult = await connection.execute(treatmentQuery, { searchValue }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            let examinationResult = await connection.execute(examinationQuery, { searchValue }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            let admissionHistoryResult = await connection.execute(admissionHistoryQuery, { searchValue }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

            // Combine results
            let combinedResult = {
                patient: patientResult.rows,
                treatment: treatmentResult.rows,
                examination: examinationResult.rows,
                admissionHistory: admissionHistoryResult.rows
            };
            res.json(combinedResult);
            console.log(combinedResult);
        } else {
            res.status(404).send({ message: "Patient not found." });
        }

    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).send({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
