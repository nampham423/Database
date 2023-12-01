-----PROCEDURE------
------------GRANT PRIVILEGES ------
alter session set "_ORACLE_SCRIPT"=true;
create user dbhosp3 identified by psw;

grant create session to dbhosp3;
GRANT DBA TO dbhosp3;
GRANT ALL PRIVILEGES TO dbhosp3;
---Q1---
CREATE OR REPLACE PROCEDURE incr_inp_fee(p_adms_date IN DATE)
AS
BEGIN
    -- Increase the fee for current inpatients
    UPDATE Treatment t
    SET fee = fee * 1.10
    WHERE (t.IP_Phone, t.Record_id) IN (
        WITH DerivedTable AS (
            SELECT t.IP_Phone, t.Record_id
            FROM Treatment t
            JOIN Admission_History a ON t.IP_Phone = a.IP_Phone AND t.Record_id = a.Record_id
            WHERE a.adms_date >= p_adms_date AND a.discharge_date IS NULL
        )
        SELECT IP_Phone, Record_id FROM DerivedTable
    );
    COMMIT; -- Commit the changes
END incr_inp_fee;

EXECUTE incr_inp_fee (TO_DATE('09-08-2023', 'DD-MM-YYYY'));
EXECUTE incr_inp_fee (TO_DATE('09-05-2023', 'DD-MM-YYYY'));

---Q2---
---VIEW DOCTOR--- 
CREATE OR REPLACE VIEW DOCTOR AS
SELECT Emp_ID Dr_ID, REPLACE(Fname, ' ', '') || ' ' || REPLACE(Lname, ' ', '') AS fullname
FROM Employee
WHERE Dr_flag = 'Y';

SELECT *
FROM Patient p
WHERE p.phone_number IN (
    SELECT DISTINCT ex.OP_Phone
    FROM Examination ex
    JOIN Doctor dr ON ex.Dr_ID = dr.Dr_ID
    WHERE dr.fullname = 'Nguyen A'
    
    UNION
    
    SELECT DISTINCT ic.IP_Phone
    FROM Incharge ic
    JOIN Doctor dr ON ic.Dr_ID = dr.Dr_ID
    WHERE dr.fullname = 'Nguyen A'
);
-------Q3---------------
CREATE OR REPLACE TYPE NumList AS TABLE OF NUMBER;

CREATE OR REPLACE FUNCTION CalculateMedicationPayment(p_patient_id IN VARCHAR2) 
RETURN NumList
AS
    v_total_payment NUMBER := 0;
    v_payment_list NumList := NumList();
    v_patient_type VARCHAR(2);
    v_patient_Phone VARCHAR(4);
BEGIN
    -- Determine patient type (Inpatient or Outpatient)
    BEGIN
        v_patient_type := SUBSTR(p_patient_id, 1, 2);
    EXCEPTION
        WHEN OTHERS THEN
            v_patient_type := NULL;
    END;

    -- Calculate total medication price based on patient type
    IF v_patient_type = 'OP' THEN
        -- Outpatient
        --Select Phone
        SELECT phone_number INTO v_patient_Phone
        FROM PATIENT
        WHERE PATIENT.OP_ID = p_patient_id;
        
        IF v_patient_Phone = null THEN 
            RETURN v_payment_list;
        END IF;

        --Select cost put into list
        SELECT Out_Med.Med_Cst_per_Exam
        BULK COLLECT INTO v_payment_list
        FROM (
            SELECT * FROM (
                SELECT OP_PHONE, RECORD_ID, exam_date, SUM(sell_price) Med_Cst_per_Exam
                FROM Exam_Med NATURAL JOIN Medication
                WHERE v_patient_Phone = OP_PHONE
                GROUP BY OP_PHONE, RECORD_ID, exam_date
                ORDER BY RECORD_ID, exam_date
                )
            ) Out_Med;
            
    ELSIF v_patient_type = 'IP' THEN
        -- Inpatient
        --Select Phone
        SELECT phone_number INTO v_patient_Phone
        FROM PATIENT
        WHERE PATIENT.IP_ID = p_patient_id;
        
        IF v_patient_Phone = null THEN 
            RETURN v_payment_list;
        END IF;

        SELECT In_Med.Med_Cst_per_Treatment
        BULK COLLECT INTO v_payment_list
        FROM (
            SELECT * FROM (
                SELECT IP_PHONE, RECORD_ID, period_number, SUM(sell_price) Med_Cst_per_Treatment
                FROM Treat_Med NATURAL JOIN Medication
                WHERE v_patient_Phone = IP_PHONE
                GROUP BY IP_PHONE, RECORD_ID, period_number
                ORDER BY RECORD_ID, PERIOD_NUMBER
                )
            ) In_Med;
                
    END IF;

    RETURN v_payment_list;
END CalculateMedicationPayment;
----------SUPPORT Q3------------
SELECT *
FROM PATIENT, (
    SELECT OP_PHONE, RECORD_ID, exam_date, SUM(sell_price) Med_Cst_per_Exam
    FROM Exam_Med NATURAL JOIN Medication 
    GROUP BY OP_PHONE, RECORD_ID, exam_date
    ) temp
WHERE PATIENT.PHONE_NUMBER = temp.OP_PHONE;

SELECT OP_PHONE, RECORD_ID, exam_date, SUM(sell_price) Med_Cst_per_Exam
FROM Exam_Med NATURAL JOIN Medication
GROUP BY OP_PHONE, RECORD_ID, exam_date
ORDER BY RECORD_ID, exam_date;

SELECT CalculateMedicationPayment ('OP000000002') FROM dual;


--------Q4---------------
CREATE OR REPLACE PROCEDURE DisplaySortEmployee(
    p_start_date IN DATE,
    p_end_date IN DATE 
)
AS
    v_sql VARCHAR(1000);

    CURSOR c_sorted IS
        SELECT *
        FROM Employee NATURAL JOIN all_empl_count_asDr
        ORDER BY COUNTPATIENT;        
BEGIN
    v_sql := '
    CREATE OR REPLACE VIEW min_exam AS
    SELECT Dr_ID, OP_phone, record_id, MIN(exam_date) MinExam_date
    FROM Examination
    GROUP BY Dr_ID, OP_phone, record_id';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW max_exam AS
    SELECT OP_phone, record_id, exam_date MaxExam_date, next_exam CorrespondNext_exam
    FROM Examination
    WHERE exam_date IN (
        SELECT MAX(exam_date)
        FROM Examination
        GROUP BY OP_phone, record_id)';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW OutpatientCount AS
    SELECT *
    FROM min_exam NATURAL JOIN max_exam';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW T1 AS
    SELECT DR_ID, COUNT(*) countPatient
    FROM OutpatientCount
    GROUP BY DR_ID';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW InPatientCount AS
    SELECT Dr_ID, IP_Phone, record_id, adms_date, discharge_date
    FROM Admission_History NATURAL JOIN (
        SELECT DISTINCT Dr_ID, IP_Phone, record_id
        FROM Incharge) new_table';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW T2 AS
    SELECT DR_ID, COUNT(*) countPatient
    FROM InPatientCount
    WHERE (discharge_date IS NULL OR discharge_date > TO_DATE(''' || TO_CHAR(p_start_date, 'DD-MM-YYYY') || ''', ''DD-MM-YYYY''))
    AND adms_date < TO_DATE(''' || TO_CHAR(p_end_date, 'DD-MM-YYYY') || ''', ''DD-MM-YYYY'')
    GROUP BY DR_ID';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW Dr_ID_with_Count AS
    SELECT DR_ID, SUM(COUNTPATIENT) COUNTPATIENT
    FROM (
        SELECT * FROM T1 
        UNION
        SELECT* FROM T2) T3
    GROUP BY DR_ID';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW DOCTOR AS
    SELECT Emp_ID Dr_ID
    FROM Employee
    WHERE Dr_flag = ''Y''';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW all_dr_count AS
    SELECT COALESCE(c.Dr_ID, d.Dr_ID) AS Dr_ID, COALESCE(c.COUNTPATIENT, 0) AS COUNTPATIENT
    FROM Dr_ID_with_Count c 
    FULL OUTER JOIN 
    DOCTOR d ON c.Dr_ID = d.Dr_ID
    ORDER BY COUNTPATIENT';
    EXECUTE IMMEDIATE v_sql;

    v_sql := '
    CREATE OR REPLACE VIEW all_empl_count_asDr AS
    SELECT d.Emp_ID AS Emp_ID, COALESCE(c.COUNTPATIENT, 0) AS COUNTPATIENT
    FROM Dr_ID_with_Count c 
    FULL OUTER JOIN 
    Employee d ON c.Dr_ID = d.Emp_ID
    ORDER BY COUNTPATIENT';
    EXECUTE IMMEDIATE v_sql;

    FOR c_rec IN c_sorted LOOP
        DBMS_OUTPUT.PUT(c_rec.Emp_ID || ', ' || c_rec.Fname || ' ' || c_rec.Lname || ', ' || c_rec.COUNTPATIENT);
        DBMS_OUTPUT.NEW_LINE;
    END LOOP;
END SortTableAByTableB;

-------Q4 SUPPORT--------
ALTER SESSION SET NLS_DATE_FORMAT = 'DD-MM-YYYY';

DECLARE
BEGIN
    SortTableAByTableB('16-5-2023', '9-7-2023');
END;

----------------- Getting patient from Dr_ID -----------
CREATE OR REPLACE FUNCTION get_patientInf_by_DrID(
  Dr_id IN VARCHAR
)
RETURN SYS_REFCURSOR
IS
  v_cursor SYS_REFCURSOR;
BEGIN
  OPEN v_cursor FOR
    SELECT *
    FROM Patient
    WHERE PATIENT.phone_number in
        (SELECT DISTINCT PHONE_NUMBER 
        FROM (
            SELECT * FROM OUTPATIENT_T 
            UNION 
            SELECT * FROM INPATIENT_T));
    
  RETURN v_cursor;
END get_patientInf_by_DrID;