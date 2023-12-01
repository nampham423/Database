MODEL
---------------------------FOR EMPLOYEE-------------------------------
CREATE TABLE Employee
(
  Emp_id VARCHAR(4) NOT NULL,
  Fname VARCHAR(10) NOT NULL,
  LName VARCHAR(20) NOT NULL,
  DOB DATE DEFAULT TO_DATE('1950-01-01', 'YYYY-MM-DD') NOT NULL,
  gender CHAR(1) CHECK (gender IN ('F', 'M')) NOT NULL,
  address VARCHAR(50),
  start_date DATE DEFAULT TO_DATE('2020-01-01', 'YYYY-MM-DD') NOT NULL,
  speciality_name VARCHAR(20) NOT NULL,
  degree_year DATE NOT NULL,
  dno INT NOT NULL,
  Dr_flag CHAR(1) DEFAULT 'N' NOT NULL,
  -- add dno constraint later
  PRIMARY KEY (Emp_id),
  CONSTRAINT chk_gender_emp CHECK (gender IN ('F', 'M')),
  CONSTRAINT chk_Dr_flag CHECK (Dr_flag IN ('Y', 'N'))
);

CREATE TABLE Emp_phone
(
  Phone VARCHAR(4) NOT NULL,
  Emp_id VARCHAR(4) NOT NULL,
  --
  PRIMARY KEY (Phone, Emp_id),
  FOREIGN KEY (Emp_id) REFERENCES Employee(Emp_id)
);

CREATE TABLE Department
(
  dnumber INT NOT NULL,
  title VARCHAR(20) NOT NULL UNIQUE,
  dean_id VARCHAR(4) NOT NULL,
  --
  PRIMARY KEY (dnumber),
  CONSTRAINT  fk_dept_dean FOREIGN KEY (dean_id) REFERENCES Employee(Emp_id) ON DELETE SET NULL  DEFERRABLE
);
-- Constraint for fkey 
ALTER TABLE Employee ADD CONSTRAINT  fk_emp_dept_dno FOREIGN KEY (dno)
    REFERENCES Department(dnumber) ON DELETE SET NULL DEFERRABLE;

-------------------------------FOR PATIENT---------------------------
CREATE TABLE Patient
(
  phone_number VARCHAR(4) NOT NULL,
  Fname VARCHAR(10) NOT NULL,
  Lname VARCHAR(20) NOT NULL,
  gender CHAR(1) CHECK (gender IN ('F', 'M')) NOT NULL,
  DOB DATE DEFAULT TO_DATE('2000-01-01', 'YYYY-MM-DD') NOT NULL,
  address VARCHAR(50) NOT NULL,
  OP_flag CHAR(1) DEFAULT 'N' NOT NULL,
  OP_id VARCHAR(11) DEFAULT NULL,
  IP_flag CHAR(1) DEFAULT 'N' NOT NULL,
  IP_id VARCHAR(11) DEFAULT NULL,

  PRIMARY KEY (phone_number),
  CONSTRAINT chk_gender CHECK (gender IN ('F', 'M')),
  CONSTRAINT chk_OP_flag CHECK (OP_flag IN ('Y', 'N')),
  CONSTRAINT chk_IN_flag CHECK (OP_flag IN ('Y', 'N'))
);

--------------------------------FOR OP---------------------------------
CREATE TABLE Treatment_history
(
  record_id INT NOT NULL,
  OP_phone VARCHAR(4) NOT NULL,
  Dr_ID VARCHAR(4) NOT NULL,

  PRIMARY KEY (record_id, OP_phone, Dr_ID),
  FOREIGN KEY (Dr_ID) REFERENCES Employee(Emp_id),
  FOREIGN KEY (OP_phone) REFERENCES Patient(phone_number)
);

CREATE TABLE Examination
(
  Dr_ID VARCHAR(4) NOT NULL,
  OP_phone VARCHAR(4) NOT NULL,
  record_id INT NOT NULL,
  exam_date DATE DEFAULT TO_DATE('01-01-2023', 'dd-mm-yyyy') NOT NULL,
  diagnosis VARCHAR(100),
  next_exam DATE,
  fee FLOAT DEFAULT 5 NOT NULL,
  
  PRIMARY KEY (Dr_ID, OP_phone, record_id, exam_date),
  FOREIGN KEY (Dr_ID, OP_phone, record_id) REFERENCES Treatment_history(Dr_ID, OP_phone, record_id)
);

------------------------FOR IP--------------------------
CREATE TABLE Admission_History
(
  IP_phone VARCHAR(4) NOT NULL,
  record_id INT NOT NULL,
  adms_date DATE NOT NULL,
  diagnosis VARCHAR(100) DEFAULT NULL,
  discharge_date DATE DEFAULT NULL,
  sickroom INT, 
  Nurse_id VARCHAR(4) NOT NULL,
  
  PRIMARY KEY (IP_phone, record_id),
  FOREIGN KEY (IP_phone) REFERENCES patient(phone_number),
  FOREIGN KEY (Nurse_id) REFERENCES Employee(Emp_id)
);

CREATE TABLE Treatment
(
  IP_phone VARCHAR(4) NOT NULL,
  record_id INT NOT NULL,
  period_number INT NOT NULL,
  start_date DATE,
  end_date DATE,
  result VARCHAR(50),
  fee FLOAT DEFAULT 0 NOT NULL,
  
  PRIMARY KEY (IP_phone, record_id, period_number),
  FOREIGN KEY (IP_phone, record_id) REFERENCES Admission_History(IP_phone, record_id)
);

CREATE TABLE Incharge
(
  Dr_ID VARCHAR(4) NOT NULL,
  IP_phone VARCHAR(4) NOT NULL,
  record_id INT NOT NULL,
  period_number INT NOT NULL,
  
  PRIMARY KEY (Dr_ID, IP_phone, record_id, period_number),
  FOREIGN KEY (IP_phone, record_id, period_number) REFERENCES Treatment(IP_phone, record_id, period_number),
  FOREIGN KEY (Dr_ID) REFERENCES Employee(Emp_id)
);

---------------------------------For Med------------------------------------
CREATE TABLE Provider
(
  Prov_ID VARCHAR(4) NOT NULL,
  address VARCHAR(50) NOT NULL,
  name VARCHAR(20) NOT NULL,
  phone VARCHAR(4) NOT NULL,
  
  PRIMARY KEY (Prov_ID)
);

CREATE TABLE Medication
(
  Med_ID VARCHAR(4) NOT NULL,
  name VARCHAR(20) NOT NULL,
  expr_date DATE NOT NULL,
  effect VARCHAR(50) DEFAULT NULL,
  sell_price FLOAT NOT NULL,
  
  PRIMARY KEY (Med_ID)
);

CREATE TABLE Provided
(
  Med_ID VARCHAR(4) NOT NULL,
  Prov_ID VARCHAR(4) NOT NULL,
  
  PRIMARY KEY (Med_ID, Prov_ID),
  FOREIGN KEY (Med_ID) REFERENCES Medication(Med_ID),
  FOREIGN KEY (Prov_ID) REFERENCES Provider(Prov_ID)
);

CREATE TABLE Import_info
(
  Med_ID VARCHAR(4) NOT NULL,
  Prov_ID VARCHAR(4) NOT NULL,
  import_date DATE NOT NULL,
  price FLOAT NOT NULL,
  quantity INT DEFAULT 5 NOT NULL,
  
  PRIMARY KEY (Med_ID, Prov_ID, import_date, price, quantity),
  FOREIGN KEY (Med_ID, Prov_ID) REFERENCES Provided(Med_ID, Prov_ID)
);

--------------------------Add Med with Patient----------------------
CREATE TABLE Exam_Med
(
  dr_id VARCHAR(4) NOT NULL,
  OP_phone VARCHAR(4) NOT NULL,
  record_id INT NOT NULL,
  exam_date DATE NOT NULL,
  Med_ID VARCHAR(4) NOT NULL,
  
  PRIMARY KEY (dr_id, OP_phone, record_id, exam_date, Med_ID),
  FOREIGN KEY (dr_id, OP_phone, record_id, exam_date) REFERENCES Examination(dr_id, OP_phone, record_id, exam_date),
  FOREIGN KEY (Med_id) REFERENCES Medication(Med_id)
);

CREATE TABLE Treat_Med
(
  IP_phone VARCHAR(4) NOT NULL,
  record_id INT NOT NULL,
  period_number INT NOT NULL,
  Med_ID VARCHAR(4) NOT NULL,
  
  PRIMARY KEY (IP_phone, record_id, period_number, Med_ID),
  FOREIGN KEY (Med_id) REFERENCES Medication(Med_id),
  FOREIGN KEY (IP_phone, record_id, period_number) REFERENCES Treatment(IP_phone, record_id, period_number)
);
