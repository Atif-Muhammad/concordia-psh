# Concordia PSH ERP - Software Requirements Specification

Version: 1.0
Date: 2026-08-08
Source code reviewed: `backend/src`, `backend/prisma/schema.prisma`, `admin-panel/config/apis.js`, `admin-panel/src/pages`

## 2. SRS

### 2.1 Purpose

The purpose of the system is to centralize institute operations and reduce manual record keeping for admissions, academics, fee management, HR/payroll, attendance, hostel/boarding, finance, front office, examinations, complaints, inventory, and reports.

### 2.2 Scope

The system must support:

- Login, logout, token refresh, and authenticated user discovery.
- Admin user management with roles and permissions.
- Department, program, class, section, session, subject, teacher-subject, teacher-class-section, subject-class, and timetable management.
- Student admission, roll number generation, search, updates, status changes, promotion/demotion, passout, expel, struck-off, rejoin, attendance and result reports.
- Teacher/staff profile management and teaching assignment access.
- Student attendance generation, marking, reporting, skips, holidays, leaves.
- Front office inquiries, visitors, complaints, contacts, remarks.
- Examination setup, exam schedules, marks, bulk marks, results, positions, reports.
- Fee heads, structures, installments, challans, payments, extra challans, challan printing, reports, settings, migration tools.
- Hostel registrations, room allocation, expenses, inventory, hostel challans, payments, revenue and analytics.
- Inventory items and item expenses.
- HR staff, employee legacy endpoints, staff leaves, leave balances, payroll settings, payroll generation, payroll payments, staff attendance, holidays, advance salary, templates, analytics.
- Finance income, expense approval workflow, closings, dashboard stats, analytics.
- Dashboard statistics and charts.
- Institute settings, report card templates, staff ID card templates, student ID card templates.

### 2.3 Stakeholders

- Super Admin: full administrative control, admin creation, permissions, sensitive reports.
- Admin: module-limited institute operator.
- Teaching staff: class, subject, student attendance, complaints assigned to them.
- Non-teaching staff: HR/front office/finance/boarding/inventory operations based on permissions.
- Finance officer: fee collection, expense, income, closing, reporting.
- Hostel warden: boarding registration, room allocation, hostel fees, hostel inventory.
- Examination officer: exams, marks, results, positions.
- Reception/front office staff: inquiries, visitors, complaints, contacts.
- Institute management: dashboard, reports, analytics, approvals.

### 2.4 User Classes and Permissions

The backend defines `Role`/`RolesEnum` with `SUPER_ADMIN` and `ADMIN`. Admin/staff permissions are JSON objects. Some routes use:

- `JwtAccGuard`: access-token required.
- `JwtRefGuard`: refresh-token required.
- `RolesGuard`: role check.
- `PermissionsGuard`: module permission check.

Permission-aware modules include admin teacher attendance routes and parts of attendance/front-office/HR/finance.

### 2.5 Functional Requirements

#### FR-01 Authentication

- System shall create a first super admin through `/api/auth/create/super-admin`.
- System shall authenticate admin/staff credentials through `/api/auth/login`.
- System shall issue access and refresh tokens in cookies.
- System shall refresh tokens through `/api/auth/refresh-tokens`.
- System shall logout and clear cookies through `/api/auth/logout`.
- System shall expose current authenticated user through `/api/auth/user-who`.

#### FR-02 Admin Management

- System shall list, create, update, and delete admins.
- System shall restrict admin management to super admin.
- System shall store admin permissions as JSON.
- System shall allow super admin to view and mark teacher attendance.

#### FR-03 Academics

- System shall manage departments, programs, classes, sections, subjects, sessions.
- System shall map teachers to subjects.
- System shall map teachers to class/section/session.
- System shall map subjects to class/session.
- System shall search teaching/non-teaching staff for assignments.
- System shall assign teacher with multiple subjects in one operation.
- System shall manage class timetables as JSON slot arrays.

#### FR-04 Student Management

- System shall list active and passout/non-active students with filters.
- System shall search students by text query.
- System shall generate latest roll number by prefix.
- System shall create/update students with photo upload.
- System shall delete student records.
- System shall promote, demote, passout, expel, struck off, and rejoin students.
- System shall maintain student academic records and status history.
- System shall expose student attendance/result raw data and printable reports.

#### FR-05 Staff and Teacher Management

- System shall manage staff records with photo upload.
- System shall support teaching/non-teaching flags, staff ID generation settings, department, designation, CNIC, documents, salaries, permissions.
- System shall keep legacy teacher and employee APIs for older UI workflows.
- System shall allow teacher-specific class, subject, and attendance workflows.

#### FR-06 Attendance

- System shall auto-generate attendance for class/section/subject/date/session.
- System shall fetch student attendance by class/section/subject/date/session.
- System shall update or delete student attendance records.
- System shall produce weekly/monthly/custom attendance reports.
- System shall manage student leaves, holidays, and attendance skips.
- System shall manage staff attendance individually, bulk, by date, and reporting.

#### FR-07 Front Office

- System shall manage inquiries, including follow-up remarks.
- System shall preserve inquiry-to-student conversion references.
- System shall manage visitor records.
- System shall manage complaints, assigned staff, remarks, status, and personal complaint views.
- System shall manage contacts by category.

#### FR-08 Examination

- System shall create, list, update, and delete exams.
- System shall manage exam schedules.
- System shall record marks individually and in bulk.
- System shall generate, list, update, and delete results.
- System shall generate, list, update, and delete student positions.
- System shall filter exams, marks, results, and positions by session/class/section/student where supported.

#### FR-09 Fee Management

- System shall manage fee heads and fee structures.
- System shall create student installments in bulk.
- System shall calculate base payable, late fees, extra fine, absenties fine, discount, arrears, paid amount, pending amount, settled amount, and status.
- System shall generate single and bulk installment challans.
- System shall generate single and bulk extra challans.
- System shall print installment and extra challans through HTML templates.
- System shall record payments and maintain transaction history.
- System shall void challans without destroying financial audit history.
- System shall keep legacy fee-management endpoints and new `/fee` endpoints.
- System shall expose fee summary, revenue over time, class stats, analytics, student summary, arrears, and payment history.
- System shall expose fee settings from institute settings.
- System shall support migration run/stats for older fee data.

#### FR-10 Hostel/Boarding

- System shall register students in hostel.
- System shall support terminate, withdraw, readmit, and history for hostel registrations.
- System shall manage rooms and allocations.
- System shall manage hostel expenses and inventory.
- System shall generate hostel challans with heads, arrears, status, payments, printable HTML.
- System shall search hostel registrations and expose room-by-student.
- System shall expose hostel revenue and analytics.

#### FR-11 Inventory

- System shall manage school inventory items.
- System shall track item quantity, category, location, purchase details, condition/status, and notes.
- System shall manage expenses related to inventory items.

#### FR-12 HR and Payroll

- System shall manage staff, legacy employees, leaves, leave balances, leave lock/status.
- System shall manage payroll settings.
- System shall generate payroll sheets and missing-staff payroll views.
- System shall generate payroll, upsert payroll records, record payroll payments, and list payroll history.
- System shall manage leave sheets.
- System shall manage staff attendance and holidays.
- System shall manage advance salaries with audit fields.
- System shall manage payroll templates.
- System shall expose HR analytics and reports.

#### FR-13 Finance

- System shall manage finance income.
- System shall manage expenses with approval workflow: pending, approved, rejected.
- System shall keep creator, approver, rejecter metadata.
- System shall manage closings by type and period.
- System shall expose dashboard stats and analytics.

#### FR-14 Configuration

- System shall manage institute settings, including name, contact, logo, challan prefix, late fee values.
- System shall manage report card templates.
- System shall manage staff ID card templates.
- System shall manage student ID card templates.
- System shall expose default templates for printing workflows.

#### FR-15 Dashboard

- System shall expose dashboard stats for students, fees, attendance, staff, finance, and charts.
- System shall require authentication for dashboard endpoints.

### 2.6 Non-Functional Requirements

- Security: access and refresh tokens stored in HTTP cookies; backend CORS allows localhost frontend and configured allowed IP.
- Authorization: sensitive routes must use guards and role/permission checks.
- Data validation: Nest global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted`, and `transform`.
- Database integrity: Prisma schema defines primary keys, unique constraints, indexes, and relations.
- Auditability: payments, challan status changes, leaves, advance salaries, student statuses, finance approvals preserve historical fields.
- Availability: backend Dockerfile and docker-compose support deployment with MySQL.
- Maintainability: modules follow Nest controller/service/module boundaries.
- Performance: indexed fields exist for major filters such as status, date, category, session, class, student, staff, challan IDs.
- File handling: uploaded photo files are served through `/uploads`; template assets through `/template-requirements`.

### 2.7 Assumptions

- API base path is `/api` due to global prefix.
- Local frontend API base URL is `http://localhost:3003/api`.
- MySQL connection comes from `DATABASE_URL`.
- Backend port comes from `PORT`.
- Authentication cookies are sent with `withCredentials: true`.
- Existing legacy endpoints are still part of supported API surface because frontend imports and backend controllers expose them.

