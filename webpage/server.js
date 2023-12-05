const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'views')));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
const dbConfig = {
    user: "newHos", password: "psw", connectionString: "localhost:1521"
};
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    import('open').then(open => {
        open.default(`http://localhost:${port}`);
    });
});

app.post('/login', async (req, res) => {
    let connection;
    const loginid = req.body;

    var regexUsername = new RegExp("^[a-zA-Z0-9_]+$");
    if (!regexUsername.test(loginid.username)) {
        res.json({ found: false });
        return;
    }

    var regexPassword = new RegExp("^[a-zA-Z0-9_!@#$%^&]+$");
    if (!regexPassword.test(loginid.password)) {
        res.json({ found: false });
        return;
    }


    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log(loginid.username, loginid.password);
        const query = `SELECT * FROM login WHERE username = :id AND pass = :pass`;
        console.log(query); // Check the generated SQL query
        
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
        console.log('Patient added successfully:', result);//hiiihihii

        result = await connection.execute(
            `SELECT * FROM Patient WHERE phone_number = :phone_number`, 
            {
                phone_number: phone_number,
            },
        );
        console.log('Patient output:', result);

        res.json({ message: "Patient added successfully", result });
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
    let connection;
    const  datas = req.body.input;
    try { 
        connection = await oracledb.getConnection(dbConfig);

        // Query for Patient details
        let patientQuery = `SELECT * FROM Patient WHERE phone_number = :datas OR OP_id = :datas OR IP_id = :datas`;
        let patientResult = await connection.execute(patientQuery, {datas}, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (patientResult.rows.length > 0) {
            res.json(patientResult.rows);
            console.log(patientResult.rows);
        } else {
            res.json({ message: "Patient not found." });
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


//---------------------------------------------------------//
//RESTFUL API, gọi cái này để vào trang detail patient
app.get('/patient/:phone', async (req, res) => {
    const { phone } = req.params;
    console.log(phone);
    // Render the EJS template with the retrieved data
    res.render('Detail_Patient', { data : phone });

});

// API mà Detail Patient gọi để lấy inf bỏ vào table
app.get('/patient/:phone/OP_info', async (req, res) => {
    const phone = req.params.phone;
    console.log('Patient Phone number:', phone);
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            `SELECT DISTINCT record_ID, Dr_ID, diagnosis, fee, 
            OP_Phone, TO_CHAR(exam_date, 'yyyy-mm-dd') exam_date
            FROM Treatment_history NATURAL JOIN Examination
            WHERE OP_phone = :phone_t
            ORDER BY record_ID`,
            { phone_t: phone }
        );

        console.log("Kết quả truy vấn:", result.rows);
        if (result.rows.length > 0) {
            res.json({ data: result.rows });
        } 
        //else {     }
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

// API cũng cái Detail Patient gọi để lấy ID và record hiện tại
app.get('/patient/:phone/new_OP_info', async (req, res) => {
    const phone = req.params.phone;
    console.log('Patient Phone number:', phone);
    let connection;
    const bind1 = {phone_t: phone};

    try {
        connection = await oracledb.getConnection(dbConfig);
    
        // Đầu tiên lấy OP ID đã
        let result = await connection.execute(
            `SELECT OP_FLAG, OP_ID  FROM PATIENT
            WHERE phone_number = :phone_t`, bind1
        );
        
        let OP_ID;
        console.log("Query đầu tiên:", result.rows);
        if (result.rows.length > 0) { //tồn tại 
            let data = result.rows[0]; //coi như nó chỉ có 1 row
            console.log("Tồn tại sdt:", data);
            if(data[0] === 'Y') //có OP_ID rồi
            { 
                OP_ID = data[1];
                console.log("Có sẵn OP_ID:", OP_ID);
                // Có rồi thì lấy max record_id, làm data để return 
                let max_record = await connection.execute(
                    `SELECT MAX(record_id) FROM Treatment_history
                    WHERE OP_phone = :phone_t`,bind1
                );
                console.log("max record_id:", max_record);

                if (max_record.rows.length > 0){ //Nếu đã có bệnh án trc đó
                    //return max_record + 1
                    return res.json({ record: max_record.rows[0][0] + 1, OP_ID: OP_ID });
                } else { //chưa có rec nào
                    return res.json({ record: 1, OP_ID: OP_ID });
                }
            } else { //Nếu chưa có 
                // Bật flag
                console.log("Chưa có OP_ID! Bật Flag");
                await connection.execute(
                    `UPDATE PATIENT  SET OP_FLAG = 'Y'
                    WHERE phone_number = :phone_t`,
                    bind1, { autoCommit: true } 
                );
                // Lấy ID mới tạo
                result = await connection.execute(
                    `SELECT OP_ID FROM PATIENT
                    WHERE phone_number = :phone_t`, bind1
                );
                OP_ID = result.rows[0][0];
                console.log("Cấp OP_ID mới:", OP_ID);
                // Tất nhiên rec sẽ là 1, đầu tiên
                return res.json({ record: 1, OP_ID: OP_ID});
            }
            // Sau khi bật flag rồi
            //res.json({ data: OP_ID });
        } 
        //else {     }
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

// API Detail Patient gọi để update Treatment_history khi add record mới
app.post('/OP/new_rec', async (req, res) => {
    try {
        const binds = { 
            RECORD_ID : req.body.RECORD_ID, 
            OP_PHONE: req.body.OP_PHONE, 
            DR_ID: req.body.DR_ID };
            
        // Insert the database with the new values
        const connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
          `INSERT INTO Treatment_history(RECORD_ID, OP_PHONE, DR_ID) 
          VALUES(:RECORD_ID, :OP_PHONE, :DR_ID)`,
          binds, { autoCommit: true }
        );
          
        //Also insert into Examination
        await connection.execute(
          `INSERT INTO Examination(RECORD_ID, OP_PHONE, DR_ID) 
          VALUES(:RECORD_ID, :OP_PHONE, :DR_ID)`,
          binds, { autoCommit: true }
        );

        // Release the connection
        await connection.close();
          
        //Redirect back to the data page with the updated information
        res.redirect(`/patient/${binds.OP_PHONE}`);
      } catch (error) {
        console.error('Error insert Treatment_history:', error);
        res.status(500).send('Internal Server Error');
    } 
});

// get route, nó render lên cái page Outpatient_detail
app.get('/patient/detail_OP/:phone/:record_ID/:dr_ID', async (req, res) => {   
    const { phone, record_ID, dr_ID } = req.params;
    console.log(phone, record_ID);

    try {
        // Retrieve parameters from the request
            
        let connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            `SELECT DR_ID, OP_PHONE, RECORD_ID,
            TO_CHAR(exam_date, 'yyyy-mm-dd') EXAM_DATE, DIAGNOSIS, 
            TO_CHAR(next_exam, 'yyyy-mm-dd') NEXT_EXAM, FEE 
            FROM Examination
            WHERE OP_phone = :phone_t AND record_id = :rec`,
            { phone_t: phone, rec: record_ID }
        );
    
        console.log("Kết quả truy vấn:", result.rows);

        // Process the result
        // Lưu ý, không bao giờ table này trống, 
        // vì Examination sẽ luôn được insert khi có record mới được thêm vào
        if(result.rows.length > 0) { //Có data
            const detailData = result.rows; //
    
            await connection.close();
        
            // Render the EJS template with the retrieved data
            res.render('Outpatient_detail', { data : detailData });
        }
        else {  
            console.error('HOW THIS CAN BE HAPPEND?', error);
        }
    } catch (error) {
        console.error('Error fetching detailed information:', error);
        res.status(500).send('Internal Server Error');
    }
});    

// Update route for handling POST requests
app.post('/updateOP', async (req, res) => {
    try {
      const { flagUpdate, DR_ID, OP_PHONE, RECORD_ID, EXAM_DATE, 
        UP_EXAM_DATE, UP_NEXT_EXAM, UP_DIAG, UP_FEE } = req.body;
          
      // Update the database with the new values
      const connection = await oracledb.getConnection(dbConfig);
      if(flagUpdate != 0) { // Để update
        console.log("UPDATE!!");
        console.log("req.body", req.body);
        resu = await connection.execute(
            `UPDATE EXAMINATION 
            SET EXAM_DATE = TO_DATE(:UP_EXAM_DATE_t, 'yyyy-mm-dd'),
            NEXT_EXAM = TO_DATE(:UP_NEXT_EXAM_t, 'yyyy-mm-dd'), 
            DIAGNOSIS = :UP_DIAG_t, FEE = :UP_FEE_t
            WHERE DR_ID = :DR_ID_t AND OP_PHONE = :OP_PHONE_t AND RECORD_ID = :RECORD_ID_t 
            AND EXAM_DATE = TO_DATE(:EXAM_DATE_t, 'yyyy-mm-dd')`,
            {
            DR_ID_t: DR_ID, OP_PHONE_t: OP_PHONE, RECORD_ID_t: RECORD_ID, 
            EXAM_DATE_t: EXAM_DATE, UP_EXAM_DATE_t: UP_EXAM_DATE, 
            UP_NEXT_EXAM_t: UP_NEXT_EXAM, UP_DIAG_t: UP_DIAG, UP_FEE_t: UP_FEE
            }, 
            { autoCommit: true }
          );
        console.log("resu.rowsAffected", resu.rowsAffected);
      }
      else { // Insert, thêm ngày hẹn khám 
        console.log("INSERT!!");
        resu = await connection.execute(
            `INSERT INTO EXAMINATION(DR_ID, OP_PHONE, RECORD_ID, EXAM_DATE, 
                DIAGNOSIS, NEXT_EXAM, FEE) 
            VALUES(:DR_ID_t, :OP_PHONE_t, :RECORD_ID_t, 
                TO_DATE(:UP_EXAM_DATE_t, 'yyyy-mm-dd'), :UP_DIAG_t, 
                TO_DATE(:UP_NEXT_EXAM_t, 'yyyy-mm-dd'), :UP_FEE_t)`,
            {
            DR_ID_t: DR_ID, OP_PHONE_t: OP_PHONE, RECORD_ID_t: RECORD_ID, 
            UP_EXAM_DATE_t: UP_EXAM_DATE, 
            UP_NEXT_EXAM_t: UP_NEXT_EXAM, UP_DIAG_t: UP_DIAG, UP_FEE_t: UP_FEE
            },
            { autoCommit: true }
        );
        console.log("resu.rowsAffected", resu.rowsAffected);
      }
  
      // Release the connection
      await connection.close();
        
      //Redirect back to the data page with the updated information
      res.redirect(`/patient/${OP_PHONE}`);
    } catch (error) {
      console.error('Error updating details:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

//-----------------------------------------------------

app.get('/patient/:phone/IP_info', async (req, res) => {
    const phone = req.params.phone;
    console.log('Patient Phone number:', phone);
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            `SELECT DISTINCT T.record_ID ,I.Dr_ID, TO_CHAR(T.ADMS_DATE,'yyyy-mm-dd') ADMS_DATE, 
            TO_CHAR(T.DISCHARGE_DATE, 'yyyy-mm-dd') DISCHARGE_DATE, T.DIAGNOSIS, T.SICKROOM, T.NURSE_ID, T.FEE, T.IP_PHONE 
            FROM (SELECT IP_Phone, record_ID, period_number, ADMS_DATE, DISCHARGE_DATE,
                diagnosis, sickroom, Nurse_ID, SUM(FEE) FEE
                    FROM ADMISSION_HISTORY NATURAL JOIN TREATMENT 
                    GROUP BY IP_Phone, record_ID, period_number, ADMS_DATE, DISCHARGE_DATE, 
                    diagnosis, sickroom, Nurse_ID) T 
            LEFT OUTER JOIN INCHARGE I 
            ON T.RECORD_ID = I.RECORD_ID AND T.IP_PHONE = I.IP_PHONE AND T.PERIOD_NUMBER = I.PERIOD_NUMBER 
            WHERE T.IP_PHONE = :phone_t
            ORDER BY T.record_ID`,
            { phone_t: phone }  
        );

        console.log("Kết quả truy vấn:", result.rows);
        if (result.rows.length > 0) {
            res.json({ data: result.rows });
        } 
        //else {     }
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

app.get('/patient/:phone/new_IP_info', async (req, res) => {
    const phone = req.params.phone;
    console.log('Patient Phone number:', phone);
    let connection;
    const bind1 = {phone_t: phone};

    try {
        connection = await oracledb.getConnection(dbConfig);
    
        // Đầu tiên lấy IP ID đã
        let result = await connection.execute(
            `SELECT IP_FLAG, IP_ID FROM PATIENT
            WHERE phone_number = :phone_t`, bind1
        );
        
        let IP_ID;
        console.log("Query đầu tiên:", result.rows);
        if (result.rows.length > 0) { //tồn tại 
            let data = result.rows[0]; //coi như nó chỉ có 1 row
            console.log("Tồn tại sdt:", data);
            if(data[0] === 'Y') //có IP_ID rồi
            { 
                IP_ID = data[1];
                console.log("Có sẵn IP_ID:", IP_ID);
                // Có rồi thì lấy max record_id, làm data để return 
                let max_record = await connection.execute(
                    `SELECT MAX(record_id) FROM Admission_History
                    WHERE IP_phone = :phone_t`,bind1
                );
                console.log("max record_id:", max_record);

                if (max_record.rows.length > 0){ //Nếu đã có bệnh án trc đó
                    //return max_record + 1
                    return res.json({ record: max_record.rows[0][0] + 1, IP_ID:IP_ID });
                } else { //chưa có rec nào
                    return res.json({ record: 1, IP_ID: IP_ID });
                }
            } else { //Nếu chưa có 
                // Bật flag
                console.log("Chưa có IP_ID! Bật Flag");
                await connection.execute(
                    `UPDATE PATIENT SET IP_FLAG = 'Y'
                    WHERE phone_number = :phone_t`,
                    bind1, { autoCommit: true } 
                );
                // Lấy ID mới tạo
                result = await connection.execute(
                    `SELECT IP_ID FROM PATIENT
                    WHERE phone_number = :phone_t`, bind1
                );
                IP_ID = result.rows[0][0];
                console.log("Cấp IP_ID mới:", IP_ID);
                // Tất nhiên rec sẽ là 1, đầu tiên
                return res.json({ record: 1, IP_ID: IP_ID});
            }
            // Sau khi bật flag rồi
            //res.json({ data: IP_ID });
        } 
        //else {     }
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
app.post('/IP/new_rec', async (req, res) => {
    try {
        const binds = { 
            RECORD_ID : req.body.RECORD_ID, 
            IP_PHONE: req.body.IP_PHONE,
        };
        
        // Insert the database with the new values
        const connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
          `INSERT INTO ADMISSION_HISTORY(RECORD_ID, IP_PHONE, NURSE_ID, ADMS_DATE) 
            VALUES(:RECORD_ID, :IP_PHONE, :NURSE_ID, TO_DATE(:ADMS_DATE, 'yyyy-mm-dd')`,
          { RECORD_ID: req.body.RECORD_ID, 
            IP_PHONE: req.body.IP_PHONE,
            NURSE_ID: req.body.NURSE_ID,
            ADMS_DATE: req.body.ADMS_DATE}, { autoCommit: true }
        );
          
        //Also insert into Treatment
        await connection.execute(
          `INSERT INTO TREATMENT(RECORD_ID,IP_PHONE,PERIOD_NUMBER)
            VALUES(:RECORD_ID, :IP_PHONE, :PERIOD_NUMBER)`,
            { RECORD_ID: req.body.RECORD_ID, 
                IP_PHONE: req.body.IP_PHONE,
                PERIOD_NUMBER: 1
            }, { autoCommit: true }
        );

        // Release the connection
        await connection.close();
          
        //Redirect back to the data page with the updated information
        res.redirect(`/patient/${binds.IP_PHONE}`);
      } catch (error) {
        console.error('Error insert Treatment:', error);
        res.status(500).send('Internal Server Error');
    } 
});



app.get('/patient/detail_IP/:phone/:record_ID/', async (req, res) => {   
    const { phone, record_ID } = req.params;
    console.log(phone, record_ID);

    try {
        // Retrieve parameters from the request
            
        let connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            ` SELECT DISTINCT
            T.PERIOD_NUMBER,
            I.DR_IDs,
            TO_CHAR(T.START_DATE, 'yyyy-mm-dd') AS START_DATE,
            TO_CHAR(T.END_DATE, 'yyyy-mm-dd') AS END_DATE,
            T.RESULT,
            T.FEE,
            T.IP_PHONE,
            T.RECORD_ID
        FROM TREATMENT T
        LEFT OUTER JOIN (
            SELECT
                I2.PERIOD_NUMBER,
                LISTAGG(I2.DR_ID, ',') WITHIN GROUP (ORDER BY I2.DR_ID) AS DR_IDs
            FROM INCHARGE I2
            WHERE I2.IP_PHONE = :phone_t AND I2.RECORD_ID = :rec
            GROUP BY I2.PERIOD_NUMBER
        ) I ON T.PERIOD_NUMBER = I.PERIOD_NUMBER
        WHERE T.IP_PHONE = :phone_t AND T.RECORD_ID = :rec
        ORDER BY T.PERIOD_NUMBER, I.DR_IDs`,
            { phone_t: phone, rec: record_ID }
        );
    
        console.log("Kết quả truy vấn:", result.rows);

        // Process the result
        // Lưu ý, không bao giờ table này trống, 
        // vì Examination sẽ luôn được insert khi có record mới được thêm vào
        if(result.rows.length > 0) { //Có data
            const detailData = result.rows; //
    
            await connection.close();
        
            // Render the EJS template with the retrieved data
            res.render('inpatient_details', { data : detailData });
        }
        else {  
            console.error('HOW THIS CAN BE HAPPEND?', error);
        }
    } catch (error) {
        console.error('Error fetching detailed information:', error);
        res.status(500).send('Internal Server Error');
    }
});    


app.post('/updateIP', async (req, res) => {
    try {
      const { flagUpdate,IP_PHONE,RECORD_ID, PERIOD_NUMBER,UP_PERIOD_NUMBER, DR_ID, START_DATE, UP_START_NUMBER, END_DATE, UP_END_NUMBER, RESULT, UP_RESULT, FEE,UP_FEE } = req.body;
          
      // Update the database with the new values
      const connection = await oracledb.getConnection(dbConfig);
      
      if(flagUpdate != 0) { // Để update
        console.log("UPDATE!!");
        console.log("req.body", req.body);
        result1 = await connection.execute(
            `UPDATE TREATMENT 
            SET START_DATE = TO_DATE(:UP_START_NUMBER_t, 'yyyy-mm-dd'),
            END_DATE = TO_DATE(:UP_END_NUMBER_t, 'yyyy-mm-dd'), 
            RESULT= :UP_RESULT_t, FEE = :UP_FEE_t, PERIOD_NUMBER = :UP_PERIOD_NUMBER_t
            WHERE  IP_PHONE = :IP_PHONE_t 
            AND START_DATE = TO_DATE(:START_DATE_t, 'yyyy-mm-dd')`,
            {
                IP_PHONE_t: IP_PHONE,

                UP_START_NUMBER_t: UP_START_NUMBER,
                UP_END_NUMBER_t: UP_END_NUMBER,
                UP_FEE_t: UP_FEE,
                UP_RESULT_t: UP_RESULT, // This property is missing in the provided bind object
                UP_PERIOD_NUMBER_t: UP_PERIOD_NUMBER,
                 
            }, 
            { autoCommit: true }
          );
        
          

        console.log("resu.rowsAffected", resu.rowsAffected);
      }
      else { // Insert, thêm ngày hẹn khám 
        console.log("INSERT!!");
        resu = await connection.execute(
            `INSERT INTO TREATMENT(IP_PHONE,PERIOD_NUMBER,START_DATE, END_DATE, RESULT,FEE,RECORD_ID) 
            VALUES( :IP_PHONE_t,:UP_PERIOD_NUMBER_t,
                TO_DATE(:UP_START_NUMBER_t, 'yyyy-mm-dd'), 
                TO_DATE(:UP_END_NUMBER_t, 'yyyy-mm-dd'),:UP_RESULT_t, :UP_FEE_t,:RECORD_ID_t)`,
            {
            IP_PHONE_t: IP_PHONE,
            UP_START_NUMBER_t: UP_START_NUMBER, 
            UP_END_NUMBER_t: UP_END_NUMBER ,UP_RESULT_t: UP_RESULT, UP_FEE_t: UP_FEE,UP_PERIOD_NUMBER_t: UP_PERIOD_NUMBER ,RECORD_ID_t:RECORD_ID
            },
            { autoCommit: true }
        );

        console.log("resu.rowsAffected", resu.rowsAffected);
        }
       
      
  
      // Release the connection
      await connection.close();
        
      //Redirect back to the data page with the updated information
      res.redirect(`/patient/${IP_PHONE}`);
    } catch (error) {
      console.error('Error updating details:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);


app.post('/addDr', async (req, res) => {
    try {
      const {  UP_DR_ID, IP_PHONE, PERIOD_NUMBER, RECORD_ID } = req.body;
          
      // Update the database with the new values
      const connection = await oracledb.getConnection(dbConfig);
      
    //   if(flagUpdate != 0) { // Để update
    //     // console.log("UPDATE!!");
    //     // console.log("req.body", req.body);
    //     // result1 = await connection.execute(
    //     //     `UPDATE  INCHARGE 
    //     //     SET DR_ID =:UP_DR_ID_t
    //     //     WHERE IP_PHONE = :IP_PHONE_t  
    //     //      `,
    //     //     {
    //     //     IP_PHONE_t: IP_PHONE, UP_DR_ID_t: UP_DR_ID
    //     //     }, 
    //     //     { autoCommit: true }
    //     //   );
        
          

    //     // console.log("resu.rowsAffected", resu.rowsAffected);
    //   }
         console.log(UP_DR_ID)
         console.log(IP_PHONE)
         console.log(RECORD_ID)
         console.log(PERIOD_NUMBER)
        console.log("INSERT!!");
        resu = await connection.execute(
            `INSERT INTO INCHARGE(DR_ID,IP_PHONE,RECORD_ID,PERIOD_NUMBER)
            VALUES (:UP_DR_ID_t, :IP_PHONE_t, :RECORD_ID_t, :PERIOD_NUMBER_t)
            `,
            {
              UP_DR_ID_t: UP_DR_ID, IP_PHONE_t: IP_PHONE, RECORD_ID_t: RECORD_ID, PERIOD_NUMBER_t : PERIOD_NUMBER
            },
            { autoCommit: true }
        );

        console.log("resu.rowsAffected", resu.rowsAffected);
        
        
        // console.log("resu.rowsAffected", resu.rowsAffected);
      
  
      // Release the connection
      await connection.close();
        
      //Redirect back to the data page with the updated information
      res.redirect(`/patient/${IP_PHONE}`);
    } catch (error) {
      console.error('Error updating details:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

//---------------------------------------------------PAYMENT RECORD-----------------------------------------------------
app.get('/patient/:phone/paymentRecordOP', async (req, res) => {
    // const phone = req.params.phone;
    // console.log('Patient Phone number:', phone);
    // let connection;

    // try {
    //     connection = await oracledb.getConnection(dbConfig);
    
    //     let result = await connection.execute(
    //         `  SELECT DISTINCT
    //         E.OP_PHONE, 
    //         E.MED_ID, 
    //         M.NAME, 
    //         M.EXPR_DATE,
    //         X.FEE,
    //         M.SELL_PRICE,
    //         P.PROV_ID
    //     FROM 
    //         EXAM_MED E
    //     JOIN 
    //         EXAMINATION X ON E.OP_PHONE = X.OP_PHONE AND E.RECORD_ID = X.RECORD_ID
    //     JOIN 
    //         MEDICATION M ON E.MED_ID = M.MED_ID
    //     JOIN 
    //         PROVIDED P ON M.MED_ID = P.MED_ID
    //     WHERE 
    //         E.OP_PHONE = :phone_t
    //      `,
    //         { phone_t: phone }  
    //     );

    //     console.log("Kết quả truy vấn:", result.rows);
    //     if (result.rows.length > 0) {
    //         res.json({ data: result.rows });
    //     } 
    //     //else {     }
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send({ error: err.message });
    // } finally {
    //     if (connection) {
    //         try {
    //             await connection.close();
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    // }
    const phone = req.params.phone;
     
    console.log('Patient Phone number:', phone);
    try {
        // Retrieve parameters from the request
            
        let connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            `  SELECT DISTINCT
                   E.OP_PHONE, 
                     E.MED_ID, 
                     M.NAME, 
                     M.EXPR_DATE,
                     X.FEE,
                     M.SELL_PRICE,
                     P.PROV_ID
                 FROM 
                     EXAM_MED E
                 JOIN 
                     EXAMINATION X ON E.OP_PHONE = X.OP_PHONE AND E.RECORD_ID = X.RECORD_ID
                 JOIN 
                     MEDICATION M ON E.MED_ID = M.MED_ID
                 JOIN 
                     PROVIDED P ON M.MED_ID = P.MED_ID
                 WHERE 
                     E.OP_PHONE = :phone_t`,
            { phone_t: phone  }
        );
    
        console.log("Kết quả truy vấn:", result.rows);

        // Process the result
        // Lưu ý, không bao giờ table này trống, 
        // vì Examination sẽ luôn được insert khi có record mới được thêm vào
        if(result.rows.length > 0) { //Có data
            const detailData = result.rows; //
    
            await connection.close();
        
            // Render the EJS template with the retrieved data
            res.render('payment_record_OP', { data : detailData });
        }
        else {  
            console.error('HOW THIS CAN BE HAPPEND?', error);
        }
    } catch (error) {
        console.error('Error fetching detailed information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/patient/:phone/paymentRecordIP', async (req, res) => {
    // const phone = req.params.phone;
    // console.log('Patient Phone number:', phone);
    // let connection;

    // try {
    //     connection = await oracledb.getConnection(dbConfig);
    
    //     let result = await connection.execute(
    //         `  SELECT DISTINCT
    //         E.OP_PHONE, 
    //         E.MED_ID, 
    //         M.NAME, 
    //         M.EXPR_DATE,
    //         X.FEE,
    //         M.SELL_PRICE,
    //         P.PROV_ID
    //     FROM 
    //         EXAM_MED E
    //     JOIN 
    //         EXAMINATION X ON E.OP_PHONE = X.OP_PHONE AND E.RECORD_ID = X.RECORD_ID
    //     JOIN 
    //         MEDICATION M ON E.MED_ID = M.MED_ID
    //     JOIN 
    //         PROVIDED P ON M.MED_ID = P.MED_ID
    //     WHERE 
    //         E.OP_PHONE = :phone_t
    //      `,
    //         { phone_t: phone }  
    //     );

    //     console.log("Kết quả truy vấn:", result.rows);
    //     if (result.rows.length > 0) {
    //         res.json({ data: result.rows });
    //     } 
    //     //else {     }
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send({ error: err.message });
    // } finally {
    //     if (connection) {
    //         try {
    //             await connection.close();
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    // }
    const phone = req.params.phone;
     
    console.log('Patient Phone number:', phone);
    try {
        // Retrieve parameters from the request
            
        let connection = await oracledb.getConnection(dbConfig);
    
        let result = await connection.execute(
            `  SELECT DISTINCT
                   E.IP_PHONE, 
                     E.MED_ID, 
                     M.NAME, 
                     M.EXPR_DATE,
                     X.FEE,
                     M.SELL_PRICE,
                     P.PROV_ID
                 FROM 
                     TREAT_MED E
                 JOIN 
                     TREATMENT X ON E.IP_PHONE = X.IP_PHONE AND E.RECORD_ID = X.RECORD_ID
                 JOIN 
                     MEDICATION M ON E.MED_ID = M.MED_ID
                 JOIN 
                     PROVIDED P ON M.MED_ID = P.MED_ID
                 WHERE 
                     E.IP_PHONE = :phone_t`,
            { phone_t: phone  }
        );
    
        console.log("Kết quả truy vấn:", result.rows);

        // Process the result
        // Lưu ý, không bao giờ table này trống, 
        // vì Examination sẽ luôn được insert khi có record mới được thêm vào
        if(result.rows.length > 0) { //Có data
            const detailData = result.rows; //
    
            await connection.close();
        
            // Render the EJS template with the retrieved data
            res.render('payment_record_OP', { data : detailData });
        }
        else {  
            console.error('HOW THIS CAN BE HAPPEND?', error);
        }
    } catch (error) {
        console.error('Error fetching detailed information:', error);
        res.status(500).send('Internal Server Error');
    }
});