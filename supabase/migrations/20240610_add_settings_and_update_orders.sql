-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_name TEXT DEFAULT 'Produto A',
  product_b_name TEXT DEFAULT 'Produto B',
  product_a_time INTEGER DEFAULT 30,
  product_b_time INTEGER DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add product names to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_a_name TEXT DEFAULT 'Produto A';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_b_name TEXT DEFAULT 'Produto B';

-- Enable realtime for settings table
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- Insert default settings if not exists
INSERT INTO settings (product_a_name, product_b_name, product_a_time, product_b_time)
SELECT 'Produto A', 'Produto B', 30, 45
WHERE NOT EXISTS (SELECT 1 FROM settings);
