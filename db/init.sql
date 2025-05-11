-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'doctor',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    contact TEXT NOT NULL,
    address TEXT,
    email TEXT,
    medical_history TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    last_visit DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    stock INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 10,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    expiry_date DATE,
    supplier TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    payment_date DATE,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 18,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    rate DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_contact ON patients(contact);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_inventory_name ON inventory(name);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_stock ON inventory(stock);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Create RLS policies
-- These policies control access to the tables

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (true);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY users_delete ON users FOR DELETE USING (false); -- Prevent deletion

-- Patients table policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY patients_select ON patients FOR SELECT USING (true);
CREATE POLICY patients_insert ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY patients_update ON patients FOR UPDATE USING (true);
CREATE POLICY patients_delete ON patients FOR DELETE USING (true);

-- Appointments table policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointments_select ON appointments FOR SELECT USING (true);
CREATE POLICY appointments_insert ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY appointments_update ON appointments FOR UPDATE USING (true);
CREATE POLICY appointments_delete ON appointments FOR DELETE USING (true);

-- Inventory table policies
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_select ON inventory FOR SELECT USING (true);
CREATE POLICY inventory_insert ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY inventory_update ON inventory FOR UPDATE USING (true);
CREATE POLICY inventory_delete ON inventory FOR DELETE USING (true);

-- Invoices table policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_select ON invoices FOR SELECT USING (true);
CREATE POLICY invoices_insert ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY invoices_update ON invoices FOR UPDATE USING (true);
CREATE POLICY invoices_delete ON invoices FOR DELETE USING (true);

-- Invoice Items table policies
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_items_select ON invoice_items FOR SELECT USING (true);
CREATE POLICY invoice_items_insert ON invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY invoice_items_update ON invoice_items FOR UPDATE USING (true);
CREATE POLICY invoice_items_delete ON invoice_items FOR DELETE USING (true);