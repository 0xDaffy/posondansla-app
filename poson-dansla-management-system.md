# PosonDansla Event Management System

## 1. Project Overview

The **PosonDansla Event Management System** is a web application
designed to manage and coordinate a Poson Dansala event where drinks or
food are freely distributed to the public.

This system helps organizers manage: - Event coordination - Donations
and funds - Expenses and bills - Task assignments - Event progress -
Real-time updates

The application supports: - Desktop devices - Mobile devices - Tablets

The system is designed to be **responsive, real-time, and role-based**.

------------------------------------------------------------------------

## 2. Project Goals

-   Manage event funds transparently
-   Track expenses and bills
-   Coordinate volunteers and organizers
-   Monitor preparation progress
-   Provide financial summaries
-   Enable real-time updates

------------------------------------------------------------------------

## 3. User Roles

### Chairman

Responsibilities: - Monitor event progress - View dashboards and
summaries - Monitor financial activities - Check task completion

Permissions: - View all dashboards - View financial reports - Monitor
tasks and progress

### Treasurer

Responsibilities: - Record donations - Manage funds - Approve expense
requests - Upload bills and receipts - Track expenses

Permissions: - Add funds - Approve or reject expenses - Upload bills -
Generate financial reports

### Main Coordinator

Responsibilities: - Create and assign tasks - Manage sub coordinators -
Request funds for event activities - Track task progress

Permissions: - Create tasks - Assign tasks - Request funds - Update
progress

### Sub Coordinators

Responsibilities: - Complete assigned tasks - Submit expense requests -
Upload receipts - Update task progress

Permissions: - Update tasks - Submit expense requests - Upload bills

------------------------------------------------------------------------

## 4. Core Features

### Authentication

-   Secure login
-   Role-based permissions
-   Session handling

### Dashboard

Each role has a customized dashboard.

Chairman Dashboard: - Total funds collected - Total expenses - Remaining
balance - Event preparation progress - Completed tasks - Pending tasks

Treasurer Dashboard: - Available funds - Expense requests - Approved
expenses - Recent transactions - Uploaded bills

Coordinator Dashboard: - Assigned tasks - Task progress - Pending
expense requests

------------------------------------------------------------------------

## 5. Fund Management

Treasurer records donations.

Fields: - amount - source - donor_name - note - date - added_by

The system calculates: - Total funds - Total expenses - Remaining
balance

------------------------------------------------------------------------

## 6. Expense Management

Workflow: 1. Coordinator submits expense request 2. Treasurer reviews
request 3. Treasurer approves or rejects 4. Bill uploaded 5. Expense
recorded

Expense categories: - Drinks - Food - Ice - Cups - Equipment -
Decorations - Transport - Miscellaneous

Status: - pending - approved - rejected

------------------------------------------------------------------------

## 7. Task Management

Features: - Create tasks - Assign tasks - Track progress - Set
deadlines - Mark completed

Status: - pending - in_progress - completed

Fields: - title - description - assigned_to - created_by - deadline -
progress_percentage

------------------------------------------------------------------------

## 8. Bill and Receipt Upload

Supported formats: - JPG - PNG - PDF

Stored in cloud storage.

------------------------------------------------------------------------

## 9. Real-Time Updates

Examples: - Expense request submitted - Expense approved - Task status
updated - Bill uploaded

------------------------------------------------------------------------

## 10. Notifications

Users receive alerts when: - Expense approved - Task assigned - Task
updated

Fields: - message - user_id - read_status - timestamp

------------------------------------------------------------------------

## 11. Reports

Financial Report: - Total donations - Total expenses - Remaining balance

Expense Report: - Expense categories - Expense history

Task Report: - Completed tasks - Pending tasks

Export formats: - CSV - PDF

------------------------------------------------------------------------

## 12. Technology Stack

Frontend: - Next.js - React - TailwindCSS - Shadcn UI

Backend: - Supabase

Database: - PostgreSQL

Realtime: - Supabase Realtime

Storage: - Supabase Storage

Hosting: - Vercel (Frontend) - Supabase (Backend)

------------------------------------------------------------------------

## 13. Database Schema

Users: id name email password role created_at

Funds: id amount source donor_name note added_by created_at

Expenses: id amount category description requested_by approved_by status
bill_image created_at

Tasks: id title description assigned_to created_by status progress
deadline created_at

Notifications: id user_id message is_read created_at

------------------------------------------------------------------------

## 14. Application Pages

-   Login
-   Register
-   Dashboard
-   Finance
-   Expense Requests
-   Tasks
-   Reports
-   Notifications
-   Users
-   Settings

------------------------------------------------------------------------

## 15. Folder Structure

    poson-dansla-system
    app/
    dashboard/
    finance/
    tasks/
    reports/
    users/
    notifications/

    components/
    dashboard/
    finance/
    tasks/
    ui/

    lib/
    supabase/
    auth/
    helpers/

    database/
    schema.sql

    docs/
    poson-dansla-management-system.md

------------------------------------------------------------------------

## 16. Security

-   Role-based access control
-   Secure authentication
-   Protected routes
-   Input validation

------------------------------------------------------------------------

## 17. Mobile Support

The application is fully responsive and supports: - Smartphones -
Tablets - Desktop computers

------------------------------------------------------------------------

## 18. Future Improvements

-   QR donation system
-   SMS notifications
-   Volunteer management
-   Budget alerts
-   Analytics dashboard

------------------------------------------------------------------------

## 19. Expected Outcome

The **PosonDansla Event Management System** will help organizers: -
Manage donations transparently - Track expenses and bills - Coordinate
event preparation - Monitor progress in real time - Maintain organized
financial records
