-- ============================================================
-- Sunflower School — Demo Staff Seed
-- ============================================================
INSERT INTO staff (id, school_id, employee_id, full_name, email, mobile_number, designation, department, join_date, is_active)
VALUES
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000001', 'EMP001', 'Ananya Borthakur',  'ananya.b@sunflowerschool.in',  '9864101001', 'Class Teacher',   'Primary',   '2018-04-01', true),
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0000-000000000001', 'EMP002', 'Kamal Nath',        'kamal.n@sunflowerschool.in',   '9864101002', 'Subject Teacher', 'Primary',   '2019-06-01', true),
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0000-000000000001', 'EMP003', 'Ranjita Phukan',    'ranjita.p@sunflowerschool.in', '9864101003', 'Class Teacher',   'Middle',    '2017-04-01', true),
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0000-000000000001', 'EMP004', 'Deep Jyoti Deka',   'deepjyoti.d@sunflowerschool.in','9864101004', 'Subject Teacher', 'Secondary', '2020-04-01', true),
  ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0000-000000000001', 'EMP005', 'Priyanka Sarmah',   'priyanka.s@sunflowerschool.in','9864101005', 'Class Teacher',   'Primary',   '2021-04-01', true)
ON CONFLICT DO NOTHING;
