CREATE TABLE IF NOT EXISTS student_directory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  dob DATE NOT NULL,
  address VARCHAR(300) NOT NULL,
  blood_type VARCHAR(10) NOT NULL,
  department VARCHAR(200) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_directory_name_ar_idx ON student_directory (name_ar);
CREATE INDEX IF NOT EXISTS student_directory_department_idx ON student_directory (department);
CREATE INDEX IF NOT EXISTS student_directory_stage_idx ON student_directory (stage);
CREATE UNIQUE INDEX IF NOT EXISTS student_directory_unique_idx ON student_directory (name_ar, dob, department);
