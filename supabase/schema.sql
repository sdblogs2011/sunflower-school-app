-- ============================================================
-- Sunflower School OS — Full Database Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE: schools
-- ============================================================
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- CORE: academic_sessions
-- ============================================================
create table academic_sessions (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,           -- e.g. "2025-26"
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTH: user_profiles (linked to Supabase auth.users)
-- ============================================================
create table user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  role text not null check (role in ('principal','admin','teacher','parent','student')),
  full_name text not null,
  email text not null,
  mobile_number text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- PEOPLE: parents
-- ============================================================
create table parents (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  mobile_number text,
  occupation text,
  address text,
  created_at timestamptz default now()
);

-- ============================================================
-- PEOPLE: students
-- ============================================================
create table students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  admission_number text not null,
  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('male','female','other')),
  address text,
  blood_group text,
  photo_url text,
  status text default 'active' check (status in ('active','inactive','transferred','alumni')),
  admission_date date,
  created_at timestamptz default now(),
  unique (school_id, admission_number)
);

-- ============================================================
-- PEOPLE: parent_student_links
-- ============================================================
create table parent_student_links (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  relation text not null check (relation in ('father','mother','guardian')),
  is_primary_contact boolean default false,
  created_at timestamptz default now(),
  unique (parent_id, student_id)
);

-- ============================================================
-- PEOPLE: staff
-- ============================================================
create table staff (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  employee_id text,
  full_name text not null,
  email text,
  mobile_number text,
  designation text,            -- e.g. "Class Teacher", "Vice Principal"
  department text,
  join_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- ACADEMIC STRUCTURE: classes, sections
-- ============================================================
create table classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,           -- e.g. "Class 1", "Grade 5"
  order_rank int default 0,
  created_at timestamptz default now()
);

create table sections (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,           -- e.g. "A", "B", "Rose"
  created_at timestamptz default now()
);

create table class_sections (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  academic_session_id uuid not null references academic_sessions(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  class_teacher_id uuid references staff(id) on delete set null,
  created_at timestamptz default now(),
  unique (academic_session_id, class_id, section_id)
);

-- ============================================================
-- ACADEMIC STRUCTURE: subjects
-- ============================================================
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz default now()
);

-- ============================================================
-- ACADEMIC STRUCTURE: enrollments
-- ============================================================
create table student_enrollments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  class_section_id uuid not null references class_sections(id) on delete cascade,
  academic_session_id uuid not null references academic_sessions(id) on delete cascade,
  roll_number int,
  enrolled_at timestamptz default now(),
  unique (student_id, academic_session_id)
);

-- ============================================================
-- ACADEMIC STRUCTURE: teacher assignments
-- ============================================================
create table teacher_assignments (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references staff(id) on delete cascade,
  class_section_id uuid not null references class_sections(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  academic_session_id uuid not null references academic_sessions(id) on delete cascade,
  created_at timestamptz default now(),
  unique (staff_id, class_section_id, subject_id, academic_session_id)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
create table attendance_sessions (
  id uuid primary key default uuid_generate_v4(),
  class_section_id uuid not null references class_sections(id) on delete cascade,
  attendance_date date not null,
  marked_by uuid references staff(id) on delete set null,
  is_submitted boolean default false,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  unique (class_section_id, attendance_date)
);

create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  attendance_session_id uuid not null references attendance_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')),
  remarks text,
  created_at timestamptz default now(),
  unique (attendance_session_id, student_id)
);

-- ============================================================
-- FEES
-- ============================================================
create table fee_structures (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  academic_session_id uuid not null references academic_sessions(id) on delete cascade,
  name text not null,           -- e.g. "Term 1 Fee", "Annual Fee"
  applicable_class_id uuid references classes(id) on delete set null,
  total_amount numeric(10,2) not null,
  due_date date,
  created_at timestamptz default now()
);

create table fee_structure_items (
  id uuid primary key default uuid_generate_v4(),
  fee_structure_id uuid not null references fee_structures(id) on delete cascade,
  item_name text not null,      -- e.g. "Tuition", "Library", "Sports"
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

create table student_fee_accounts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  fee_structure_id uuid not null references fee_structures(id) on delete cascade,
  academic_session_id uuid not null references academic_sessions(id) on delete cascade,
  total_amount numeric(10,2) not null,
  amount_paid numeric(10,2) default 0,
  balance numeric(10,2) generated always as (total_amount - amount_paid) stored,
  created_at timestamptz default now(),
  unique (student_id, fee_structure_id)
);

create table payment_records (
  id uuid primary key default uuid_generate_v4(),
  student_fee_account_id uuid not null references student_fee_accounts(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  payment_date date not null,
  payment_mode text check (payment_mode in ('cash','online','cheque','dd','other')),
  reference_number text,
  receipt_number text,
  collected_by uuid references staff(id) on delete set null,
  remarks text,
  created_at timestamptz default now()
);

-- ============================================================
-- NOTICES
-- ============================================================
create table notices (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references staff(id) on delete set null,
  publish_status text default 'draft' check (publish_status in ('draft','published','archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  attachment_url text,
  created_at timestamptz default now()
);

create table notice_audiences (
  id uuid primary key default uuid_generate_v4(),
  notice_id uuid not null references notices(id) on delete cascade,
  audience_type text not null check (audience_type in ('all','class','role')),
  class_section_id uuid references class_sections(id) on delete cascade,
  role text check (role in ('principal','admin','teacher','parent','student')),
  created_at timestamptz default now()
);

create table notice_reads (
  id uuid primary key default uuid_generate_v4(),
  notice_id uuid not null references notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz default now(),
  unique (notice_id, user_id)
);

-- ============================================================
-- HOMEWORK
-- ============================================================
create table homework (
  id uuid primary key default uuid_generate_v4(),
  class_section_id uuid not null references class_sections(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  created_by uuid references staff(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  created_at timestamptz default now()
);

create table homework_attachments (
  id uuid primary key default uuid_generate_v4(),
  homework_id uuid not null references homework(id) on delete cascade,
  file_url text not null,
  file_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- EXAMS & MARKS
-- ============================================================
create table exams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  academic_session_id uuid not null references academic_sessions(id) on delete cascade,
  name text not null,           -- e.g. "Unit Test 1", "Half Yearly"
  exam_type text,               -- e.g. "unit_test", "terminal", "annual"
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table exam_subjects (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid not null references exams(id) on delete cascade,
  class_section_id uuid not null references class_sections(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  exam_date date,
  max_marks numeric(6,2) not null default 100,
  pass_marks numeric(6,2),
  created_at timestamptz default now(),
  unique (exam_id, class_section_id, subject_id)
);

create table marks_records (
  id uuid primary key default uuid_generate_v4(),
  exam_subject_id uuid not null references exam_subjects(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  marks_obtained numeric(6,2),
  is_absent boolean default false,
  remarks text,
  entered_by uuid references staff(id) on delete set null,
  created_at timestamptz default now(),
  unique (exam_subject_id, student_id)
);

-- ============================================================
-- RESOURCES
-- ============================================================
create table resources (
  id uuid primary key default uuid_generate_v4(),
  class_section_id uuid not null references class_sections(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  created_by uuid references staff(id) on delete set null,
  title text not null,
  description text,
  file_url text,
  resource_type text,           -- e.g. "pdf", "video", "link"
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on user_profiles(user_id);
create index on user_profiles(school_id, role);
create index on students(school_id, admission_number);
create index on students(school_id, full_name);
create index on student_enrollments(academic_session_id, class_section_id);
create index on attendance_sessions(class_section_id, attendance_date);
create index on payment_records(student_id, payment_date);
create index on notices(publish_status, published_at);
create index on homework(class_section_id, due_date);
create index on marks_records(exam_subject_id, student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables — policies added per role in next step
-- ============================================================
alter table schools enable row level security;
alter table academic_sessions enable row level security;
alter table user_profiles enable row level security;
alter table parents enable row level security;
alter table students enable row level security;
alter table parent_student_links enable row level security;
alter table staff enable row level security;
alter table classes enable row level security;
alter table sections enable row level security;
alter table class_sections enable row level security;
alter table subjects enable row level security;
alter table student_enrollments enable row level security;
alter table teacher_assignments enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table fee_structures enable row level security;
alter table fee_structure_items enable row level security;
alter table student_fee_accounts enable row level security;
alter table payment_records enable row level security;
alter table notices enable row level security;
alter table notice_audiences enable row level security;
alter table notice_reads enable row level security;
alter table homework enable row level security;
alter table homework_attachments enable row level security;
alter table exams enable row level security;
alter table exam_subjects enable row level security;
alter table marks_records enable row level security;
alter table resources enable row level security;

-- ============================================================
-- RLS HELPER FUNCTION
-- Returns the school_id and role for the current logged-in user
-- ============================================================
create or replace function get_my_profile()
returns table(school_id uuid, role text) language sql security definer as $$
  select school_id, role from user_profiles where user_id = auth.uid();
$$;

-- ============================================================
-- RLS POLICIES — user_profiles
-- ============================================================
-- Users can read their own profile
create policy "user can read own profile"
  on user_profiles for select
  using (user_id = auth.uid());

-- Admin/principal can read all profiles in their school
create policy "admin can read school profiles"
  on user_profiles for select
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin')
  );

-- Admin/principal can insert profiles
create policy "admin can insert profiles"
  on user_profiles for insert
  with check (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin')
  );

-- Admin/principal can update profiles in their school
create policy "admin can update profiles"
  on user_profiles for update
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin')
  );

-- ============================================================
-- RLS POLICIES — schools
-- ============================================================
create policy "users can read own school"
  on schools for select
  using (id in (select school_id from get_my_profile()));

create policy "principal can update school"
  on schools for update
  using (
    id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) = 'principal'
  );

-- ============================================================
-- RLS POLICIES — students
-- ============================================================
create policy "staff can read students in school"
  on students for select
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin','teacher')
  );

create policy "parent can read linked students"
  on students for select
  using (
    id in (
      select psl.student_id from parent_student_links psl
      join parents p on p.id = psl.parent_id
      where p.user_id = auth.uid()
    )
  );

create policy "student can read own record"
  on students for select
  using (
    id in (
      select s.id from students s
      join user_profiles up on up.school_id = s.school_id
      where up.user_id = auth.uid() and up.role = 'student' and up.full_name = s.full_name
    )
  );

create policy "admin can insert students"
  on students for insert
  with check (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin')
  );

create policy "admin can update students"
  on students for update
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin')
  );

-- ============================================================
-- RLS POLICIES — notices (example of read-wide, write-restricted)
-- ============================================================
create policy "all school users can read published notices"
  on notices for select
  using (
    school_id in (select school_id from get_my_profile())
    and publish_status = 'published'
  );

create policy "staff can read all notices in school"
  on notices for select
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin','teacher')
  );

create policy "staff can insert notices"
  on notices for insert
  with check (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin','teacher')
  );

create policy "staff can update own notices"
  on notices for update
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin','teacher')
  );

-- ============================================================
-- RLS POLICIES — attendance (teachers mark, parents/students read)
-- ============================================================
create policy "teacher can manage attendance sessions"
  on attendance_sessions for all
  using (
    (select role from get_my_profile()) in ('principal','admin','teacher')
  );

create policy "all school users can read attendance records"
  on attendance_records for select
  using (
    (select role from get_my_profile()) in ('principal','admin','teacher','parent','student')
  );

create policy "teacher can write attendance records"
  on attendance_records for insert
  with check ((select role from get_my_profile()) in ('principal','admin','teacher'));

create policy "teacher can update attendance records"
  on attendance_records for update
  using ((select role from get_my_profile()) in ('principal','admin','teacher'));

-- ============================================================
-- RLS POLICIES — fees (admin writes, parent/student reads own)
-- ============================================================
create policy "admin can manage fee structures"
  on fee_structures for all
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin')
  );

create policy "all staff can read fee structures"
  on fee_structures for select
  using (
    school_id in (select school_id from get_my_profile())
    and (select role from get_my_profile()) in ('principal','admin','teacher')
  );

create policy "admin can manage student fee accounts"
  on student_fee_accounts for all
  using ((select role from get_my_profile()) in ('principal','admin'));

create policy "parent can read own child fee accounts"
  on student_fee_accounts for select
  using (
    student_id in (
      select psl.student_id from parent_student_links psl
      join parents p on p.id = psl.parent_id
      where p.user_id = auth.uid()
    )
  );

create policy "admin can manage payments"
  on payment_records for all
  using ((select role from get_my_profile()) in ('principal','admin'));

create policy "parent can read own child payments"
  on payment_records for select
  using (
    student_id in (
      select psl.student_id from parent_student_links psl
      join parents p on p.id = psl.parent_id
      where p.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES — homework
-- ============================================================
create policy "teacher can manage homework"
  on homework for all
  using ((select role from get_my_profile()) in ('principal','admin','teacher'));

create policy "parent and student can read homework"
  on homework for select
  using ((select role from get_my_profile()) in ('parent','student'));

-- ============================================================
-- RLS POLICIES — marks
-- ============================================================
create policy "teacher can manage marks"
  on marks_records for all
  using ((select role from get_my_profile()) in ('principal','admin','teacher'));

create policy "parent and student can read marks"
  on marks_records for select
  using ((select role from get_my_profile()) in ('parent','student'));

-- ============================================================
-- SEED: Insert default school record
-- Replace with your actual school details
-- ============================================================
insert into schools (id, name, address, email, phone, website)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sunflower School',
  'Enter school address here',
  'sunflower2026@gmail.com',
  'Enter phone number',
  'sunflowerschool.in'
);

-- ============================================================
-- SEED: Insert default academic session
-- ============================================================
insert into academic_sessions (school_id, name, start_date, end_date, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  '2025-26',
  '2025-04-01',
  '2026-03-31',
  true
);
