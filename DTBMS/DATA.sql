--DATA
CREATE OR REPLACE VIEW MedicationStatus AS
SELECT
    m.*,
    CASE WHEN m.expr_date < SYSDATE THEN 'Y' ELSE 'N' END AS is_out_of_date
FROM Medication m;

--------------EMPLOYEE---------------------
SET CONSTRAINTS fk_emp_dept_dno DEFERRED;
SET CONSTRAINT  fk_dept_dean DEFERRED;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD-MM-YYYY';

INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1001', 'Nguyen', 'A', 'F', 'abc1', '01-01-2020', 'Neurology', '01-01-2015', 1, 'Y');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1002', 'Le', 'B', 'M', 'xyz1', '01-02-2020', 'Cardiology', '01-02-2015', 2, 'Y');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1003', 'Tran', 'C', 'F', 'mnp1', '1-3-2020', 'Urology', '1-3-2015', 3, 'Y');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1004', 'Nguyen', 'D', 'M', 'abc2', '1-4-2020', 'Psychiatry', '1-4-2015', 4, 'Y');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1005', 'Le', 'E', 'F', 'xyz2', '1-5-2020', 'Neurology', '1-5-2015', 1, 'N');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1006', 'Tran', 'F', 'M', 'mnp2', '1-6-2020', 'Cardiology', '1-6-2020', 2, 'N');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1007', 'Nguyen', 'G', 'F', 'abc3', '1-7-2020', 'Urology', '1-7-2020', 3, 'N');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1008', 'Le', 'H', 'M', 'xyz3', '1-8-2020', 'Psychiatry', '1-8-2020', 4, 'N');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1009', 'Tran', 'I', 'F', 'mnp3', '1-9-2020', 'Neurology', '1-9-2015', 1, 'Y');
INSERT INTO Employee (Emp_ID, Fname, Lname, gender, address, start_date, speciality_name, degree_year, dno, Dr_flag ) VALUES ('1010', 'Nguyen', 'J', 'M', 'abc4', '1-10-2020', 'Cardiology', '1-10-2020', 2, 'Y');

INSERT INTO Department (dnumber, title, dean_id) VALUES (1, 'Neurology', '1001');
INSERT INTO Department (dnumber, title, dean_id) VALUES (2, 'Cardiology', '1002');
INSERT INTO Department (dnumber, title, dean_id) VALUES (3, 'Urology', '1003');
INSERT INTO Department (dnumber, title, dean_id) VALUES (4, 'Psychiatry', '1004');

COMMIT;

---------------PATIENT-------------------
INSERT INTO Patient (phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES ('0001', 'A', 'Nguyen', 'M', TO_DATE('2000-01-01', 'YYYY-MM-DD'), 'abc1', 'N', 'N');
INSERT INTO Patient (phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES ('0002', 'B', 'Le', 'F', TO_DATE('2000-01-01', 'YYYY-MM-DD'), 'xyz1', 'Y', 'N');
INSERT INTO Patient (phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES ('0003', 'C', 'Tran', 'M', TO_DATE('2000-01-01', 'YYYY-MM-DD'), 'mnp1', 'N', 'Y');
INSERT INTO Patient (phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES ('0004', 'D', 'Nguyen', 'F', TO_DATE('2000-01-01', 'YYYY-MM-DD'), 'abc2', 'N', 'N');
INSERT INTO Patient (phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES ('0005', 'E', 'Le', 'M', TO_DATE('2000-01-01', 'YYYY-MM-DD'), 'xyz2', 'Y', 'Y');
UPDATE Patient SET OP_flag='Y' WHERE phone_number='0001';

-----------------------TREATMENT / ADMISSION-------------------------
INSERT INTO Admission_History (IP_phone, record_id, adms_date, sickroom, Nurse_ID ) VALUES ('0003', 1, '10-05-2023', 1, '1005');
INSERT INTO Admission_History (IP_Phone, Record_id, adms_date, sickroom, Nurse_ID ) VALUES ('0005', 1, '10-5-2023', 2, '1006');
INSERT INTO Treatment (IP_phone, Record_id, period_number, start_date, end_date, result, fee) VALUES ('0003', 1, 1, '10-5-2023', '30-5-2023', 'weak', 10);
INSERT INTO Treatment (IP_phone, Record_id, period_number, start_date, end_date, result, fee) VALUES ('0003', 1, 2, '30-5-2023', '10-6-2023', ' Recovered ', 10);
INSERT INTO Treatment (IP_phone, Record_id, period_number, start_date, end_date, result, fee) VALUES ('0005', 1, 1, '10-5-2023', '30-5-2023', 'weak', 10);
INSERT INTO Treatment (IP_phone, Record_id, period_number, start_date, end_date, result, fee) VALUES ('0005', 1, 2, '30-5-2023', '10-7-2023', 'recovered', 10);
INSERT INTO Admission_History (IP_Phone, Record_id, adms_date, discharge_date, sickroom, Nurse_ID ) VALUES ('0003', 2, '10-7-2023', null, 3, '1005');
INSERT INTO Admission_History (IP_Phone, Record_id, adms_date, discharge_date, sickroom, Nurse_ID ) VALUES ('0005', 2, '10-8-2023', null, 4, '1006');

INSERT INTO Treatment (IP_phone, Record_id, period_number, start_date, end_date, result, fee) VALUES ('0003', 2, 1, '10-7-2023', '20-8-2023', 'weak ', 10);
INSERT INTO Treatment (IP_phone, Record_id, period_number, start_date, end_date, result, fee) VALUES ('0005', 2, 1, '10-8-2023', '20-8-2023', 'weak ', 10);

INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1001', '0003', 1, 1);
INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1002', '0003', 1, 1);
INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1001', '0003', 1, 2);
INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1003', '0005', 1, 1);
INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1003', '0005', 1, 2);
INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1004', '0003', 2, 1);
INSERT INTO Incharge (Dr_ID, IP_Phone, Record_id, period_number ) VALUES ('1004', '0005', 2, 1);

-------------------------------
INSERT INTO Treatment_history (record_id, OP_phone, Dr_ID) VALUES (1, '0002', '1001');
INSERT INTO Treatment_history (record_id, OP_phone, Dr_ID) VALUES (2, '0002', '1002');
INSERT INTO Treatment_history (record_id, OP_phone, Dr_ID) VALUES (1, '0005', '1001');

INSERT INTO Examination (Dr_ID, OP_phone, record_id, exam_date, next_exam, fee ) VALUES ('1001', '0002', 1, '10-5-2023', '15-5-2023', 5);
INSERT INTO Examination (Dr_ID, OP_phone, record_id, exam_date, next_exam, fee ) VALUES ('1001', '0002', 1, '16-5-2023', null, 5);
INSERT INTO Examination (Dr_ID, OP_phone, record_id, exam_date, next_exam, fee ) VALUES ('1002', '0002', 2, '20-6-2023', null, 5);
INSERT INTO Examination (Dr_ID, OP_phone, record_id, exam_date, next_exam, fee ) VALUES ('1001', '0005', 1, '11-7-2023', null, 5);


------------------------MEDICATION------------------


INSERT INTO Provider (Prov_ID, address, name, phone ) VALUES ('9001', 'xyz1', 'A', '9001');
INSERT INTO Provider (Prov_ID, address, name, phone ) VALUES ('9002', 'xyz2', 'B', '9002');
INSERT INTO Provider (Prov_ID, address, name, phone ) VALUES ('9003', 'xyz3', 'C', '9003');
INSERT INTO Provider (Prov_ID, address, name, phone ) VALUES ('9004', 'xyz4', 'D', '9004');

INSERT INTO Medication (Med_ID, name, expr_date, sell_price ) VALUES ('A1', 'A', '20-11-2023', 5);
INSERT INTO Medication (Med_ID, name, expr_date, sell_price ) VALUES ('A2', 'A', '20-11-2024', 6);
INSERT INTO Medication (Med_ID, name, expr_date, sell_price ) VALUES ('B1', 'B', '20-9-2023', 10);
INSERT INTO Medication (Med_ID, name, expr_date, sell_price ) VALUES ('B2', 'B', '20-9-2024', 9);

INSERT INTO Provided (Med_ID, Prov_ID ) VALUES ('A1', '9001');
INSERT INTO Provided (Med_ID, Prov_ID ) VALUES ('A1', '9002');
INSERT INTO Provided (Med_ID, Prov_ID ) VALUES ('A2', '9001');
INSERT INTO Provided (Med_ID, Prov_ID ) VALUES ('B1', '9002');
INSERT INTO Provided (Med_ID, Prov_ID ) VALUES ('B2', '9002');

INSERT INTO Import_info (Med_ID, Prov_ID, import_date, Price ) VALUES ('A1', '9001', '1-1-2023', 4);
INSERT INTO Import_info (Med_ID, Prov_ID, import_date, Price ) VALUES ('A1', '9002', '1-1-2023', 3);
INSERT INTO Import_info (Med_ID, Prov_ID, import_date, Price ) VALUES ('A1', '9001', '1-2-2023', 2);
INSERT INTO Import_info (Med_ID, Prov_ID, import_date, Price ) VALUES ('A2', '9001', '1-3-2023', 5);
INSERT INTO Import_info (Med_ID, Prov_ID, import_date, Price ) VALUES ('B1', '9002', '1-4-2023', 8);
INSERT INTO Import_info (Med_ID, Prov_ID, import_date, Price ) VALUES ('B2', '9002', '1-5-2023', 7);



INSERT INTO Exam_Med (Dr_ID, OP_phone, record_id, exam_date, Med_ID ) VALUES ('1001', '0002', 1, '10-5-2023', 'A1');
INSERT INTO Exam_Med (Dr_ID, OP_phone, record_id, exam_date, Med_ID ) VALUES ('1001', '0002', 1, '10-5-2023', 'B1');
INSERT INTO Exam_Med (Dr_ID, OP_phone, record_id, exam_date, Med_ID ) VALUES ('1001', '0002', 1, '16-5-2023', 'B1');
INSERT INTO Exam_Med (Dr_ID, OP_phone, record_id, exam_date, Med_ID ) VALUES ('1002', '0002', 2, '20-6-2023', 'A2');
INSERT INTO Exam_Med (Dr_ID, OP_phone, record_id, exam_date, Med_ID ) VALUES ('1001', '0005', 1, '11-7-2023', 'B2');

INSERT INTO Treat_Med (IP_Phone, record_id, period_number, Med_ID ) VALUES ('0003', 1, 1, 'A1');
INSERT INTO Treat_Med (IP_Phone, record_id, period_number, Med_ID ) VALUES ('0005', 1, 1, 'B1');
INSERT INTO Treat_Med (IP_Phone, record_id, period_number, Med_ID ) VALUES ('0005', 1, 2, 'A2');
INSERT INTO Treat_Med (IP_Phone, record_id, period_number, Med_ID ) VALUES ('0003', 2, 1, 'A2');
INSERT INTO Treat_Med (IP_Phone, record_id, period_number, Med_ID ) VALUES ('0005', 2, 1, 'B2');
INSERT INTO Treat_Med (IP_Phone, record_id, period_number, Med_ID ) VALUES ('0005', 2, 1, 'A2');
