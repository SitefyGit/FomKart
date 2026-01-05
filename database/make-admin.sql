-- Insert admin user
INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  'fa791bcb-c84a-416c-bca3-ef283d9a5a8a',
  'super_admin',
  '{"all": true}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', permissions = '{"all": true}'::jsonb;
