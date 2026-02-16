-- جدول كودات الطلبة الامتحانية (5 أرقام فريدة)
CREATE TABLE IF NOT EXISTS student_exam_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) NOT NULL,
  name_ar VARCHAR(300) NOT NULL,
  department VARCHAR(300) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  study_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS student_exam_codes_code_idx ON student_exam_codes (code);
CREATE INDEX IF NOT EXISTS student_exam_codes_department_idx ON student_exam_codes (department);
CREATE INDEX IF NOT EXISTS student_exam_codes_stage_idx ON student_exam_codes (stage);
CREATE INDEX IF NOT EXISTS student_exam_codes_study_type_idx ON student_exam_codes (study_type);
