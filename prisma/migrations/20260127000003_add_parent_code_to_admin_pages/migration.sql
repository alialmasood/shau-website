-- إضافة عمود parent_code في جدول admin_pages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_pages' AND column_name = 'parent_code'
    ) THEN
        ALTER TABLE admin_pages ADD COLUMN parent_code VARCHAR(50);
        
        -- إضافة foreign key constraint (self-referencing)
        ALTER TABLE admin_pages ADD CONSTRAINT admin_pages_parent_code_fkey 
        FOREIGN KEY (parent_code) REFERENCES admin_pages(code) ON DELETE SET NULL;
        
        -- تحديث البيانات الموجودة: required-documents -> registration
        UPDATE admin_pages 
        SET parent_code = 'registration' 
        WHERE code = 'required-documents' AND parent_code IS NULL;
    END IF;
END $$;
