# TRACKSERV
## Section 5: Implementation and Installation

**Project:** TrackServ - A Web-Based Civic Reporting and Tracking Platform  
**Group:** TrackServ, Group 04  
**Date:** 5 November 2026

## 5.1 Introduction

System implementation is the stage in which the approved design is converted into a working application. For TrackServ, implementation produced four connected React applications:

1. the Citizen Portal for reporting and community participation;
2. the Administrative Portal for administrator-level oversight and administration;
3. the Management Portal for daily municipal operations; and
4. the TrackStaff application for assigned field work.

The applications use one Supabase backend. Supabase PostgreSQL stores profiles, categories, reports, images, assignments, events, community records, and security/audit data. Supabase Auth manages authentication, Storage manages media, database functions and Edge Functions perform trusted operations, and Realtime subscriptions support authorised updates between the applications.

Implementation was iterative. The original proposal anticipated a custom Node.js/PHP and MySQL backend, but the delivered solution uses Supabase to reduce infrastructure overhead and provide authentication, database, storage, server-side functions, and realtime capabilities in one platform.

The implementation process included:

- translating the requirements and data model into React screens and Supabase queries;
- creating citizen reporting and location workflows;
- building administrative oversight, moderation, access-review, and audit workflows;
- building Management Portal report monitoring, assignment, scheduling, status, and analysis workflows;
- building the TrackStaff assigned-work and resolution workflow;
- applying role-aware access and database security policies;
- validating forms, coordinates, media, and account actions;
- adding automated tests for selected helpers;
- building the portals for deployment; and
- documenting installation, configuration, testing, and limitations.

## 5.2 Coding

### 5.2.1 Programming languages and frameworks

- **JavaScript/JSX:** application logic and user interfaces.
- **React:** component-based interfaces for the citizen, manager, and administrative portals.
- **CSS:** responsive layouts, visual states, map/list views, forms, dashboards, and accessibility presentation.
- **SQL:** Supabase policies, triggers, audit tables, activity functions, and community-reporting rules.
- **TypeScript:** Supabase Edge Functions for privileged account and moderation operations.
- **PostgreSQL/Supabase:** relational persistence, authentication integration, storage, RPCs, and row-level security.

### 5.2.2 Citizen Portal coding

The Citizen Portal implements:

- registration and authenticated login;
- password recovery and recovery-session validation;
- report creation with category, description, additional information, severity, images, and location;
- GPS, map selection, address search, reverse geocoding, and Tshwane boundary validation;
- report list and status tracking;
- report voting;
- community posts, comments, likes, saves, badges, and post reporting;
- profile activity and moderation feedback; and
- profile screens.

The report form validates required data before inserting the report. Photographs are uploaded to Supabase Storage and linked to the report. The interface displays location feedback and prevents an out-of-area location from being submitted as a valid Tshwane report.

### 5.2.3 Administrative Portal coding

The Administrative Portal implements:

- authenticated administrator sign-in;
- analysis dashboards for reports, workload, roles, and community activity;
- community moderation;
- service-issue oversight;
- user management and profile editing;
- administrator access review;
- audit-log display;
- staff/manager account creation and profile updates through Edge Functions;
- administrator suspension/restoration or role revocation safeguards; and
- configurable idle session timeout.

Privileged account creation and profile operations are executed through Supabase Edge Functions. The service-role key is not placed in frontend code, browser storage, or `VITE_*` variables. The SQL migrations add administrator policies, audit tables/triggers, security settings, and moderation-related database functions.

### 5.2.4 Management Portal coding

The Management Portal implements:

- manager authentication and role aliases (`moderator` and legacy `manager`);
- report lists and detail views;
- map-based locations;
- assignments to staff or groups;
- scheduled events;
- report status and severity changes;
- analysis and profile statistics; and
- Supabase Realtime refreshes for report, event, assignment, and analysis views.

The Management Portal is the operational workspace for managers. It is separate from the Administrative Portal: administrators manage platform accounts, security, moderation, and audit functions, while managers coordinate municipal reports, assignments, events, statuses, and workload.

### 5.2.5 TrackStaff coding

The TrackStaff application implements:

- staff-only login and role restriction;
- assigned issue dashboard and detail view;
- status, severity, category, date, and location views;
- interactive assigned-issue map;
- attendance/work-start recording;
- transition to in-progress work;
- scheduled event information;
- proof/completion image upload;
- resolution note and attendant capture;
- resolved/completed workflow; and
- staff activity and work history.

### 5.2.6 Database and security coding

The database design uses `profiles`, `categories`, `reports`, `report_images`, `report_votes`, `issue_resolutions`, `events`, community tables, and audit/security tables. Current report assignment is represented by `assigned_to`, `assigned_to_group_id`, and `assigned_at` fields on `reports`.

Security-related implementation includes:

- Supabase Auth session handling;
- role checks for citizen, staff, manager/moderator, and administrator experiences;
- row-level security policies;
- administrator-only policies for management and audit data;
- server-side account and moderation functions;
- suspended-administrator restrictions;
- moderation thresholds based on distinct reporters;
- storage upload restrictions in relevant flows; and
- database audit triggers for selected profile, service-report, community-post, and moderation-report changes.

### 5.2.7 Coding evidence

The repository contains source in:

- `Users/TrackServ/src` for the citizen portal;
- `Admin/Admin_Portal/src` for the administrative portal;
- `Manager/Managers_Portal/src` for the Management Portal;
- `Staff/TrackStaff/servers/src` for the TrackStaff application; and
- `Users/TrackServ/supabase` and `Admin/Admin_Portal/supabase` for SQL and Edge Functions.

## 5.3 Testing

Testing was used to identify defects, confirm functional behaviour, and check that the implementation still meets the requirements. TrackServ uses several levels of testing.

### 5.3.1 Unit testing

Unit tests check small reusable functions and rules in isolation. Current repository examples include:

- `Users/TrackServ/src/Components/requireServiceArea.test.js`, which tests service-area access logic; and
- `Manager/Managers_Portal/src/utils/managerAccess.test.js`, which tests manager-role aliases and rejects citizen, staff, and administrator roles for manager access.

### 5.3.2 Functional testing

Functional testing checks complete user actions such as:

- registering and signing in;
- requesting and completing password recovery;
- creating a report;
- validating a report location;
- uploading permitted images;
- filtering and prioritising reports;
- assigning work;
- starting attendance;
- uploading completion evidence;
- adding resolution details;
- moderating a post or account report; and
- reviewing audit entries.

### 5.3.3 Integration testing

Integration testing checks that the applications and Supabase work together. Important integration paths are:

- a citizen report appearing in the Management Portal and authorised administrative report views;
- a manager assignment appearing in the assigned staff member's application;
- an administrator assignment being visible to the assigned staff member;
- staff attendance and progress being visible to authorised municipal users;
- completion evidence and resolution notes being available to the administration workflow; and
- resolved/closed status being visible to the reporting citizen.

### 5.3.4 Security and access testing

Security tests must confirm that:

- citizens cannot access administrator or staff pages;
- staff members see only permitted assigned work;
- managers and administrators receive only their authorised operations;
- the current administrator cannot modify their own access;
- at least one active administrator remains;
- suspended administrators cannot use protected admin operations;
- privileged keys are absent from frontend variables; and
- RLS and storage policies prevent unauthorised reads and writes.

### 5.3.5 Usability and responsive testing

The interfaces should be checked on desktop, tablet, and mobile browser widths. Particular attention is required for:

- citizen report forms and map selection;
- administrative map/list scanning and filtering;
- staff issue detail, evidence upload, and completion actions; and
- clear status, severity, error, success, and loading messages.

### 5.3.6 Validation evidence

The following repository validation was recorded on 5 November 2026:

| Validation item | Result |
|---|---|
| Admin Portal production build (`npm run build`) | Passed |
| Citizen helper test suite | Passed: `requireServiceArea.test.js` |
| Manager access helper test suite | Passed: `managerAccess.test.js` |
| Full Citizen/Manager Jest runs | Partially executed: helper tests pass, but `App.test.js` is blocked by the installed `react-router-dom`/`react-router` dependency mismatch (`Cannot find module 'react-router/dom'`) |
| Full cross-application integration/UAT | Still required |
| Concurrent realtime load test | Still required |
| Full production RLS/storage verification | Still required |

The final three items must not be described as passed until they are executed against the configured Supabase project and documented.

## 5.4 System testing

System testing evaluates the complete TrackServ workflow rather than one function in isolation. Each test case compares the expected result with the actual result and records a final status.

### 5.4.1 System test cases

| ID | Test objective | Input/action | Expected result | Final status |
|---|---|---|---|---|
| TC001 | Verify citizen registration | Valid name, email, and password | Account is created and the user can sign in | To execute in configured environment |
| TC002 | Verify citizen login | Valid citizen credentials | Citizen portal opens; protected pages are available | To execute in configured environment |
| TC003 | Verify password recovery | Registered email and valid recovery link | Recovery session opens and accepts a new password | To execute in configured environment |
| TC004 | Verify report creation | Category, description, severity, location, and permitted image | Report is saved and appears in the citizen's reports | To execute in configured environment |
| TC005 | Verify location validation | A point inside and outside Tshwane | Inside location is accepted; outside location is clearly rejected or blocked | Partially covered by helper tests; execute end-to-end |
| TC006 | Verify citizen tracking | Open a submitted report | Current status and report details are displayed | To execute in configured environment |
| TC007 | Verify report voting | Authenticated citizen selects vote | Vote count/toggle is updated without duplicate voting | To execute in configured environment |
| TC008 | Verify administrator login restriction | Citizen/staff credentials used at admin login | Unauthorised role is denied access | To execute in configured environment |
| TC009 | Verify report oversight | Administrator opens report map/list | Authorised reports, locations, severity, and statuses are visible | To execute in configured environment |
| TC010 | Verify management oversight | Manager opens the Management Portal report map/list | Operational reports, locations, severity, and statuses are visible | To execute in configured environment |
| TC011 | Verify management assignment | Manager assigns a report to staff or a group | Assignment and assigned timestamp are stored | To execute in configured environment |
| TC012 | Verify staff visibility | Assigned and unassigned reports exist | Staff sees permitted assigned work and not unrelated work | To execute in configured environment |
| TC013 | Verify attendance and progress | Staff starts attendance | Start time is recorded and report changes to in progress | To execute in configured environment |
| TC014 | Verify completion evidence | Staff uploads proof image and resolution note | Evidence and resolution details are stored against the report | To execute in configured environment |
| TC015 | Verify resolution propagation | Staff completes assigned work | Authorised management, administration, and citizen views show the updated result | To execute in configured environment |
| TC016 | Verify realtime refresh | Change a report, assignment, or event in one application | Other authorised subscribed views refresh or report a visible subscription error | To execute in configured environment |
| TC017 | Verify community moderation | Administrator dismisses, reviews, or removes a reported post | Decision is applied and reporter activity feedback is created | To execute in configured environment |
| TC018 | Verify administrator access safeguards | Admin attempts self-change or last-admin removal | Operation is blocked with an explanatory error | To execute in configured environment |
| TC019 | Verify audit logging | Change profile, report, post, or moderation data | Appropriate audit entry records action, actor, and timestamp | To execute in configured environment |
| TC020 | Verify invalid upload handling | Unsupported type or oversized image | Upload is rejected with a clear error | To execute in configured environment |
| TC021 | Verify responsive usability | Use citizen, admin, management, and staff screens at mobile/tablet/desktop widths | Controls remain usable and information remains understandable | To execute in configured environment |

### 5.4.2 Evaluation of results

The available repository-level results show that selected helper tests pass and the Admin Portal can be built for production. These results confirm that the relevant source compiles in that portal and that the tested access/location helpers behave as expected.

They do not, by themselves, prove that the entire distributed system is ready for production. The remaining system test cases require a configured Supabase environment, representative accounts for each role, seeded reports/events, storage access, and concurrent sessions. Failed cases must be logged with the defect, corrected, and retested. A final release decision should be made only after all Must requirements in the SRS pass.

## 5.5 Installation: software application installation

### 5.5.1 Installation model

TrackServ uses web-based/cloud deployment. Users access the portals through a web browser; they do not install a native desktop application. Developers can run the portals locally using the package scripts.

### 5.5.2 Prerequisites

- Windows, macOS, or Linux development machine;
- Node.js and npm;
- access to the TrackServ source repository;
- a configured Supabase project;
- Supabase project URL and anonymous key supplied through the relevant frontend configuration;
- Supabase CLI for applying SQL/deploying Edge Functions where required; and
- browser permissions for location access when using GPS.

Service-role keys are server-side secrets only and must never be placed in frontend code, `VITE_*` variables, or browser storage.

### 5.5.3 Local installation

For each application:

```text
cd <application-folder>
npm install
npm start
```

The Admin Portal uses:

```text
cd Admin/Admin_Portal
npm install
npm run dev
```

The Citizen and Manager portals use Create React App scripts:

```text
cd Users/TrackServ
npm install
npm start

cd Manager/Managers_Portal
npm install
npm start
```

The TrackStaff source and deployment instructions should be followed from its application folder and package configuration when the field application package is restored/available in the deployment environment.

### 5.5.4 Supabase configuration

1. Create or select the Supabase project.
2. Apply the SQL files in the documented order:
   - Admin Portal security settings and session timeout SQL;
   - community post-reporting SQL;
   - profile activity and moderation SQL; and
   - administrator access-review SQL when it is available in the deployment package.
3. Configure Auth redirect URLs for the hosted citizen and admin portals, including the password-reset route.
4. Configure Storage buckets and policies for profile, report, community, and completion media.
5. Deploy the required Edge Functions:

```text
supabase functions deploy create-account --project-ref YOUR_PROJECT_REF
supabase functions deploy update-account-profile --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-access-review --project-ref YOUR_PROJECT_REF
supabase functions deploy moderate-account --project-ref YOUR_PROJECT_REF
```

6. Set `SUPABASE_SERVICE_ROLE_KEY` only as a server-side function secret.
7. Seed categories and create verified role accounts for testing.
8. Execute the system test cases in Section 5.4.

### 5.5.5 Production build and deployment

Build commands are:

```text
cd Users/TrackServ
npm run build

cd Admin/Admin_Portal
npm run build

cd Manager/Managers_Portal
npm run build
```

The Admin Portal production build was verified successfully on 5 November 2026. The citizen and manager portals include GitHub Pages deployment scripts. The Admin Portal workflow builds and deploys its `dist` output through GitHub Actions. After deployment, configure the GitHub Pages source and add the hosted base URLs to Supabase Auth redirect allowlists.

### 5.5.6 Installation verification

After installation:

- open each hosted portal in a supported browser;
- verify that the correct login page is displayed;
- sign in with a test account for each role;
- submit a test citizen report;
- confirm that the report appears in the Management Portal and authorised Administrative Portal views;
- assign it to staff from the Management Portal and confirm staff visibility;
- complete the staff workflow with evidence and resolution notes;
- confirm the resulting status in the citizen, Management Portal, and Administrative Portal views;
- inspect audit and moderation behaviour; and
- record any configuration or policy errors before release.

## 5.6 Section 5 conclusion

TrackServ has been implemented as a four-portal web system with a shared Supabase backend. The coding stage produced the Citizen Portal, Administrative Portal, Management Portal, and TrackStaff workflows; testing includes selected automated checks and production build validation; system testing is defined through traceable test cases; and installation uses local npm development plus cloud/static web deployment. The final implementation-stage requirement is to execute and record the complete cross-application, security, realtime, usability, and acceptance test set against the configured deployment environment.
