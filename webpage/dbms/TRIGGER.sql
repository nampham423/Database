--TRIGGER
-------------------------------------------- TRIGGER FOR EMPLOYEE----------------------------------------
CREATE OR REPLACE TRIGGER check_deanID_is_doctor
BEFORE INSERT OR UPDATE ON department
FOR EACH ROW
DECLARE
    v_flag CHAR(1);
BEGIN
    -- Retrieve the flag for the Dean_id from the Employee table
    SELECT Dr_flag INTO v_flag
    FROM Employee
    WHERE emp_ID = :NEW.Dean_id;

    -- Check if the flag is 'dr'
    IF v_flag = 'Y' THEN
        -- Allow the insert to proceed
        NULL;
    ELSE
        -- Raise an error if the flag is not 'dr'
        RAISE_APPLICATION_ERROR(-20001, 'Cannot insert into department: Dean must be a doctor.');
    END IF;
END;
------
CREATE OR REPLACE TRIGGER check_5_year
BEFORE INSERT OR UPDATE ON department
FOR EACH ROW
DECLARE
    v_degree_year DATE;
    v_experience_years NUMBER;
BEGIN
    -- Retrieve the flag for the Dean_id from the Employee table
    SELECT degree_year INTO v_degree_year
    FROM Employee
    WHERE emp_ID = :NEW.Dean_id;

    v_experience_years := TRUNC(MONTHS_BETWEEN(SYSDATE, v_degree_year) / 12);
    -- Check if larger than 5y
    IF v_experience_years > 5 THEN
        -- Allow the insert to proceed
        NULL;
    ELSE
        -- Raise an error
        RAISE_APPLICATION_ERROR(-20002, 'Dean must have more than 5 years of experience since receiving the specialty degree.');
    END IF;
END;
------
CREATE OR REPLACE TRIGGER check_match_speciality
BEFORE INSERT OR UPDATE ON department
FOR EACH ROW
DECLARE
    v_speciality VARCHAR(20);
BEGIN
    -- Retrieve the flag for the Dean_id from the Employee table
    SELECT speciality_name INTO v_speciality
    FROM Employee
    WHERE emp_ID = :NEW.Dean_id;

    -- Check if match speciality
    IF v_speciality = :NEW.title THEN
        -- Allow the insert to proceed
        NULL;
    ELSE
        -- Raise an error
        RAISE_APPLICATION_ERROR(-20003, 'The specialty of the Dean doesnt match with the Department.');
    END IF;
END;

-------------------------------------TRIGGER FOR PATIENT----------------------------
-------------------CREATE SEQ TO INCR ID---------------------------
CREATE SEQUENCE OP_seq
   START WITH 1
   INCREMENT BY 1
   NOCACHE
   NOCYCLE;
   
CREATE SEQUENCE IP_seq
   START WITH 1
   INCREMENT BY 1
   NOCACHE
   NOCYCLE;
---------------------RESET SEQ IF NEED-------------------
ALTER SEQUENCE OP_seq RESTART START WITH 1; // reset 
ALTER SEQUENCE IP_seq RESTART START WITH 1;
------------------------------------------------------
------------------ TRIGGER---------------
CREATE OR REPLACE TRIGGER generate_patient_code
BEFORE INSERT OR UPDATE ON Patient
FOR EACH ROW
BEGIN
   IF :NEW.OP_flag = 'Y' AND :OLD.OP_flag != 'Y' THEN
      :NEW.OP_id := 'OP' || TO_CHAR(OP_seq.NEXTVAL, 'FM000000000');
   END IF;

   IF :NEW.IP_flag = 'Y' AND :OLD.IP_flag != 'Y' THEN
      :NEW.IP_id := 'IP' || TO_CHAR(IP_seq.NEXTVAL, 'FM000000000');
   END IF;
END;

----------------------------------------------TRIGGER FOR OutPatient------------------------------------------ 

CREATE OR REPLACE TRIGGER check_to_add_Outpatient
BEFORE INSERT OR UPDATE ON Treatment_history
FOR EACH ROW
DECLARE
    v_OP_flag CHAR(1);
BEGIN
    -- Retrieve the OP_flag for the given phone_number from the Patient table
    SELECT OP_flag INTO v_OP_flag
    FROM Patient
    WHERE phone_number = :NEW.OP_phone;
    -- Check if the retrieved OP_flag is 'Y'
    IF v_OP_flag = 'Y' THEN
        -- Allow the update to proceed
        NULL;
    ELSE
        -- Raise an error if OP_flag is not 'Y'
        RAISE_APPLICATION_ERROR(-20001, 'Cannot update Treatment_history: OP_flag is not ''Y'' in the referenced Patient.');
    END IF;
END;

-----
CREATE OR REPLACE TRIGGER check_is_doctor_for_Treatment_history
BEFORE INSERT OR UPDATE ON Treatment_history
FOR EACH ROW
DECLARE
    v_flag CHAR(1);
BEGIN
    -- Retrieve the flag for the Dr from the Employee table
    SELECT Dr_flag INTO v_flag
    FROM Employee
    WHERE emp_ID = :NEW.Dr_ID;

    -- Check if the flag is 'dr'
    IF v_flag = 'Y' THEN
        -- Allow the insert to proceed
        NULL;
    ELSE
        -- Raise an error if the flag is not 'dr'
        RAISE_APPLICATION_ERROR(-20006, 'DrID must belong to Dr!');
    END IF;
END;

-----------TRIGGER For Exam----------- 
CREATE OR REPLACE TRIGGER check_next_exam_date
BEFORE INSERT OR UPDATE ON Examination
FOR EACH ROW
DECLARE
BEGIN
  IF :NEW.next_exam IS NOT NULL AND :NEW.next_exam <= :NEW.exam_date THEN
    RAISE_APPLICATION_ERROR(-20004, 'Next exam date must be later than exam date.');
  END IF;
END;
---Khong can lam, vi no tham chieu tu Treatment_history---
CREATE OR REPLACE TRIGGER check_if_OP_bf_Exam
BEFORE INSERT OR UPDATE ON Examination
FOR EACH ROW
DECLARE
    v_OP_flag CHAR(1);
BEGIN
    -- Retrieve the OP_flag for the given phone_number from the Patient table
    SELECT OP_flag INTO v_OP_flag
    FROM Patient
    WHERE Patient.phone_number = :NEW.OP_phone;
    -- Check if the retrieved OP_flag is 'Y'
    IF v_OP_flag = 'Y' THEN
        -- Allow the update to proceed
        NULL;
    ELSE
        -- Raise an error if OP_flag is not 'Y'
        RAISE_APPLICATION_ERROR(-20005, 'Examination is just for Outpatient!');
    END IF;
END;
---Khong can lam, vi no tham chieu tu Treatment_history---
CREATE OR REPLACE TRIGGER check_is_doctor_for_Exam
BEFORE INSERT OR UPDATE ON Examination
FOR EACH ROW
DECLARE
    v_flag CHAR(1);
BEGIN
    -- Retrieve the flag for the Dr from the Employee table
    SELECT Dr_flag INTO v_flag
    FROM Employee
    WHERE emp_ID = :NEW.Dr_ID;

    -- Check if the flag is 'dr'
    IF v_flag = 'Y' THEN
        -- Allow the insert to proceed
        NULL;
    ELSE
        -- Raise an error if the flag is not 'dr'
        RAISE_APPLICATION_ERROR(-20006, 'DrID must belong to Dr!');
    END IF;
END;

--------------------------------------------------TRIGGER FOR InPatient----------------------------------------
CREATE OR REPLACE TRIGGER check_if_Inpationt_bf_Adms
BEFORE INSERT OR UPDATE ON Admission_History
FOR EACH ROW
DECLARE
    v_IP_flag CHAR(1);
BEGIN
    -- Retrieve the IP_flag for the given phone_number from the Patient table
    SELECT IP_flag INTO v_IP_flag
    FROM Patient
    WHERE phone_number = :NEW.IP_phone;
    -- Check if the retrieved OP_flag is 'Y'
    IF v_IP_flag = 'Y' THEN
        -- Allow the update to proceed
        NULL;
    ELSE
        -- Raise an error if OP_flag is not 'Y'
        RAISE_APPLICATION_ERROR(-20001, 'It must be InPatient to get Admission!');
    END IF;
END;

---
CREATE OR REPLACE TRIGGER check_is_Nurse_in_Adms
BEFORE INSERT OR UPDATE ON Admission_History
FOR EACH ROW
DECLARE
    v_flag CHAR(1);
BEGIN
    SELECT Dr_flag INTO v_flag
    FROM Employee
    WHERE Emp_ID = :NEW.Nurse_ID;
    -- Check if the retrieved Dr_flag is 'N' aka is a Nurse
    IF v_flag = 'N' THEN
        -- Allow the update to proceed
        NULL;
    ELSE
        -- Raise an error if OP_flag is not 'Y'
        RAISE_APPLICATION_ERROR(-20001, 'NurseID must belong to Nurse, NOT a Dr!');
    END IF;
END;

---
CREATE OR REPLACE TRIGGER check_end_late_start_treat
BEFORE INSERT OR UPDATE ON Treatment
FOR EACH ROW
BEGIN
  IF (:NEW.end_date IS NOT NULL OR :NEW.end_date IS NOT NULL) AND :NEW.end_date <= :NEW.start_date THEN
    RAISE_APPLICATION_ERROR(-20004, 'End date must be later than Start date!');
  END IF;
END;

---
CREATE OR REPLACE TRIGGER check_is_Dr_Incharge
BEFORE INSERT OR UPDATE ON Incharge
FOR EACH ROW
DECLARE
    v_flag CHAR(1);
BEGIN
    SELECT Dr_flag INTO v_flag
    FROM Employee
    WHERE Emp_ID = :NEW.Dr_ID;
    -- Check if the retrieved Dr_flag is 'Y'
    IF v_flag = 'Y' THEN
        -- Allow the update to proceed
        NULL;
    ELSE
        -- Raise an error if OP_flag is not 'Y'
        RAISE_APPLICATION_ERROR(-20001, 'DrID must belong to Doctor!');
    END IF;
END;

-----when result in treatment = recoverd
CREATE OR REPLACE TRIGGER auto_update_discharge_date 
BEFORE INSERT OR UPDATE ON Treatment
FOR EACH ROW
BEGIN
    :NEW.result := LOWER(REPLACE(:NEW.result, ' ', ''));
    IF :NEW.result = 'recovered' THEN
        UPDATE Admission_History
        SET discharge_date = :NEW.end_date
        WHERE IP_Phone = :NEW.IP_Phone AND Record_id = :NEW.Record_id;
    END IF;
END;

---If update the result not yet recorvered---
CREATE OR REPLACE TRIGGER update_result_not_recovered
BEFORE UPDATE ON Treatment
FOR EACH ROW
DECLARE
BEGIN
    :NEW.result := LOWER(REPLACE(:NEW.result, ' ', ''));
    IF :NEW.result != 'recovered' AND :OLD.result = 'recovered' THEN
        ---set discharge_date to Null again---
        UPDATE Admission_History
        SET discharge_date = null
        WHERE IP_Phone = :NEW.IP_Phone AND Record_id = :NEW.Record_id;
    END IF;
END;

------------
CREATE OR REPLACE TRIGGER start_date_later_adms_date
BEFORE INSERT ON Treatment
FOR EACH ROW
DECLARE
    v_admission_date DATE;
BEGIN
    -- Retrieve the admission date for the specified IP_ID and Record_ID
    SELECT adms_date INTO v_admission_date
    FROM Admission_History
    WHERE IP_Phone = :NEW.IP_Phone AND Record_ID = :NEW.Record_ID;
    -- Check if the start_date is larger than the admission date
    IF :NEW.start_date < v_admission_date THEN
        RAISE_APPLICATION_ERROR(-20011, 'start_date of Treatment must be later than Admis_date!');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- No admission history found for the specified IP_ID and Record_ID
        -- You may choose to handle this situation as per your requirements
        RAISE_APPLICATION_ERROR(-20012, 'No corresponding admission history found.');
END start_date_later_adms_date;

--------------
CREATE OR REPLACE TRIGGER larger_period_larger_start_date
BEFORE INSERT ON Treatment
FOR EACH ROW
DECLARE
    v_previous_start_date DATE;
    v_next_start_date DATE;
BEGIN
    SELECT MAX(start_date) INTO v_previous_start_date
    FROM Treatment
    WHERE IP_Phone = :NEW.IP_Phone
      AND Record_ID = :NEW.Record_ID
      AND period_number < :NEW.period_number;

    SELECT MIN(start_date) INTO v_next_start_date
    FROM Treatment
    WHERE IP_Phone = :NEW.IP_Phone
      AND Record_ID = :NEW.Record_ID
      AND period_number > :NEW.period_number;

    -- Check the conditions
    IF (v_previous_start_date IS NOT NULL AND :NEW.start_date <= v_previous_start_date) OR
       (v_next_start_date IS NOT NULL AND :NEW.start_date >= v_next_start_date) THEN
        -- Raise an exception to prevent the insertion
        RAISE_APPLICATION_ERROR(-20015, 'Invalid start date for the given period.');
    END IF;
END larger_period_larger_start_date;


--------------------------------------------------Trigger Exclusive for OP and IP-----------------------------
---------------
CREATE OR REPLACE TRIGGER OP_import_check_IP_exclusive
BEFORE INSERT ON Examination
FOR EACH ROW
DECLARE
    v_admission_start_date DATE;
    v_admission_end_date DATE;
BEGIN
    -- Retrieve all admission date ranges for the outpatient
    FOR admission_rec IN (
        SELECT adms_date, discharge_date
        FROM Admission_History a
        WHERE a.IP_Phone = :NEW.OP_Phone
    ) LOOP
        -- Check if the exam date is within any admission date range
        IF admission_rec.adms_date IS NOT NULL AND (:NEW.exam_date BETWEEN admission_rec.adms_date AND COALESCE(admission_rec.discharge_date, SYSDATE)) THEN
            -- Raise an exception to prevent the insertion
            RAISE_APPLICATION_ERROR(-20010, 'Exam date conflicts with inpatient admission dates.');
        END IF;
    END LOOP;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- No inpatient admission found for the outpatient, continue with the insertion
        NULL;
END OP_import_check_IP_exclusive;

---CHECK--- INSERT INTO Examination (Dr_ID, OP_phone, record_id, exam_date, next_exam, fee ) VALUES ('1001', '0005', 1, '21-6-2023', null, 5);


----------------------------
CREATE OR REPLACE TRIGGER IP_import_check_OP_exclusive
BEFORE INSERT ON Admission_History
FOR EACH ROW
DECLARE
    v_exam_date DATE;
BEGIN
    -- Retrieve all admission date ranges for the outpatient
    FOR rec IN (
        SELECT MIN(exam_date) start_date, MAX(exam_date) end_date
        FROM Examination e
        WHERE e.OP_Phone = :NEW.IP_Phone
        GROUP BY e.OP_Phone, e.record_id
    ) LOOP
        -- Check if the exam date is within any admission date range
        IF rec.start_date IS NOT NULL AND :NEW.adms_date BETWEEN rec.start_date AND rec.end_date THEN
            -- Raise an exception to prevent the insertion
            RAISE_APPLICATION_ERROR(-20010, 'Admission date conflicts with Outpatient exam dates.');
        END IF;
    END LOOP;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- No inpatient admission found for the outpatient, continue with the insertion
        NULL;
END IP_import_check_OP_exclusive;

