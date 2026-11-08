# TRACKSERV PROJECT PROPOSAL
## Revised post-implementation proposal

**Department:** Computer Science and Informatics (CSIS6809)  
**Project:** TrackServ - A Web-Based Civic Reporting and Tracking Platform  
**Group:** TrackServ, Group 04  
**Revision date:** 5 November 2026

## 1. Abstract

TrackServ is a web-based civic reporting and service-tracking platform that connects residents, municipal administrators, managers, and municipal field staff. The project has developed beyond the original citizen-reporting concept into a connected solution consisting of four applications: the Citizen Portal, Administrative Portal, Management Portal, and TrackStaff field-service application. The applications share a Supabase PostgreSQL database, Supabase Authentication, Supabase Storage, database functions, row-level security policies, and realtime change subscriptions.

The citizen portal allows residents to register, recover passwords, report municipal issues, attach photographs, select or search for a location, validate that the location is within the Tshwane service area, follow report progress, vote on existing reports, participate in community discussions, and manage profiles. The Administrative Portal provides administrator-level report oversight, community moderation, user management, administrator access review, and audit-log review. The Management Portal provides operational report monitoring, map-based location management, filtering, prioritisation, manual report entry, staff assignment, event scheduling, status updates, and management analytics. TrackStaff provides authorised field staff with assigned-issue views, maps, attendance/work-start recording, progress updates, scheduled visits, completion evidence, resolution notes, and work history.

The revised proposal records the delivered system, the change from the originally planned custom backend to Supabase, and the remaining work required before wider municipal rollout.

## 2. Introduction and background

Residents commonly report damaged roads, water leaks, electricity faults, illegal dumping, overflowing waste, and other civic problems through disconnected channels. This makes it difficult for residents to receive reliable progress information and difficult for municipal personnel to triage, assign, monitor, and evaluate work.

TrackServ addresses this problem through a single digital workflow:

1. A resident submits a categorised issue with a description, location, and optional photographs.
2. The municipal administration reviews, prioritises, assigns, and schedules the issue.
3. The assigned field staff member receives the work, records attendance and progress, and uploads completion evidence.
4. The resident and authorised municipal users can see the resulting status and resolution information.

## 3. Problem statement

The project addresses:

- the absence of a central and accessible civic reporting channel;
- limited transparency about report status and resolution;
- inaccurate or incomplete issue-location information;
- weak mechanisms for community support and discussion;
- the administrative difficulty of prioritising, assigning, and monitoring issues; and
- the lack of a focused digital workflow for field-service staff.

## 4. Aim and objectives

### 4.1 Aim

To provide a secure, transparent, and coordinated web platform for reporting, managing, assigning, resolving, and evaluating municipal service issues.

### 4.2 Objectives

- Provide guided issue reporting for citizens.
- Improve location accuracy through GPS, search, map selection, reverse geocoding, and Tshwane-boundary validation.
- Make report progress visible to the reporting citizen.
- Support municipal triage, prioritisation, assignment, scheduling, and analysis.
- Provide managers with a dedicated operational portal for daily service coordination.
- Give field staff the information and workflow needed to complete assigned work.
- Record completion evidence and resolution notes.
- Support community voting, discussion, and moderation.
- Protect data with authentication, role checks, row-level security, storage controls, server-side functions, and audit records.
- Keep the four application experiences consistent through a shared Supabase backend.

## 5. Scope

### 5.1 Citizen portal

The citizen portal includes:

- registration, sign-in, sign-out, and password recovery;
- profile and profile-picture management;
- guided report creation with category, description, additional information, severity, photographs, and location;
- GPS capture, location search, map selection, reverse geocoding, and municipality-boundary validation;
- personal report tracking and status display;
- report voting and report support;
- community posts, likes, saved posts, comments, badges, and post reporting;
- profile activity and moderation feedback; and

### 5.2 Administrative portal

The administrative portal includes:

- administrator authentication and access checks;
- service-issue oversight and a live map/list view;
- search, filtering, severity management, and report status management;
- manual report creation;
- staff and group assignment;
- scheduled field events;
- analysis of report volume, categories, workload, resolution, and community activity;
- community moderation;
- user and profile management;
- administrator access review, suspension/restoration, and role revocation;
- configurable idle session timeout; and
- an audit-log view for relevant account, report, post, and moderation changes.

### 5.3 Management Portal

The Management Portal includes:

- manager authentication and role validation;
- report lists, details, and map-based location monitoring;
- report filtering, prioritisation, severity, and status management;
- manual report/location entry;
- assignment of issues to staff members or groups;
- scheduled field events;
- management analysis and profile statistics; and
- realtime refreshes for reports, assignments, events, and analysis data.

### 5.4 TrackStaff field application

The TrackStaff application includes:

- staff-only authentication;
- assigned-issue list, detail, and map views;
- filtering and sorting of assigned work;
- attendance/work-start recording;
- transition to in-progress work;
- scheduled visit viewing;
- completion/proof photograph upload;
- resolution notes and attendant recording;
- resolved/completed workflow; and
- work-history and activity views.

### 5.5 Out of scope for this release

- native iOS or Android applications;
- integration with municipal legacy systems;
- biometric authentication;
- multi-municipality configuration;
- automated email and SMS notification services;
- predictive analytics; and
- server-side services that cannot be hosted by the selected static/cloud deployment model.

## 6. Revised technology and architecture

The original concept considered React with a custom Node.js/PHP and MySQL backend. During implementation, the backend was revised to Supabase:

- React is used for the Citizen, Administrative, Management, and TrackStaff interfaces.
- Supabase PostgreSQL is the shared relational data store.
- Supabase Auth manages user identity and sessions.
- Supabase Storage stores report, profile, community, and completion media.
- Supabase database functions/RPCs implement trusted operations such as voting, moderation counts, and account actions.
- Supabase Edge Functions provide server-side account creation, profile updates, account review, and moderation workflows.
- Row-level security policies restrict data by role and ownership.
- Supabase Realtime subscriptions refresh report, assignment, event, and analysis views after authorised database changes.
- Leaflet and map/geocoding services support location selection and operational map views.
- The citizen, management, and TrackStaff applications use Create React App; the administrative portal uses Vite.
- GitHub Pages workflows/build outputs provide the static hosting model for the portals.

This revision reduces custom infrastructure and separates the four user experiences while retaining a shared source of truth. It also makes database policies, trusted functions, storage policies, and migration documentation especially important.

## 7. System components and workflow

### 7.1 Citizen workflow

The citizen signs in, completes the guided report form, selects a category and severity, provides a description, chooses a location, uploads permitted photographs, and submits the report. The report is stored in Supabase and becomes available to authorised municipal users. The citizen can later follow status changes, community votes, and resolution information.

### 7.2 Administration workflow

An authorised administrator reviews incoming issues, uses the map and filters to identify priority work, updates severity or status, assigns the report to a staff member or group, and schedules a visit when needed. The administrator can then review staff progress, completion evidence, analytics, moderation decisions, account actions, and audit history.

### 7.3 Management workflow

An authorised manager uses the Management Portal to monitor operational reports, inspect locations, filter and prioritise work, create manual reports, assign issues to staff or groups, schedule field events, update statuses, and review workload and management statistics. Realtime subscriptions refresh the operational views when authorised report or event changes occur.

### 7.4 Field-service workflow

An authorised staff member opens the TrackStaff application and sees the assigned reports permitted for that account. The staff member opens the issue, checks the location and evidence, starts attendance, records progress, uploads completion evidence, enters resolution details, and completes the issue. The authorised administrative and citizen views can then reflect the updated workflow.

## 8. New developments reflected in this revision

The following developments were not fully represented in the original proposal:

1. Delivery of a separate Management Portal for daily municipal operations.
2. Delivery of a separate TrackStaff application for field personnel.
3. Replacement of the planned custom backend with Supabase PostgreSQL, Auth, Storage, Realtime, RPCs, and Edge Functions.
4. Location-aware citizen reporting with GPS, search, reverse geocoding, map selection, and Tshwane boundary checking.
5. Administrative live map, service-issue oversight, moderation, access review, audit, and account-management workflows.
6. Management Portal live map, service-issue oversight, assignment, scheduling, analysis, status management, and manual-entry workflows.
7. Account creation and profile-update functions that keep service-role credentials server-side.
8. Community moderation, account reporting, profile activity, and moderation feedback.
9. Administrator access review with safeguards against self-modification and removal of the last active administrator.
10. Audit logging for relevant profile, report, community, and moderation changes.
11. Password recovery with a hosted redirect configuration.
12. Configurable administrative idle-session timeout.
13. Deployment/build guidance for the citizen, management, and administrative portals.
14. Automated unit-level tests for selected citizen and manager access/location helpers, plus a successful Admin Portal production build.

## 9. Data and security design

The central entities include `profiles`, `categories`, `reports`, `report_images`, `report_votes`, `issue_resolutions`, `events`, community entities, and audit/security tables. Report assignment is currently represented by fields on `reports`, including `assigned_to`, `assigned_to_group_id`, and `assigned_at`, rather than a separate assignment table.

Security controls implemented or documented include:

- Supabase Auth and role-aware application access;
- server-side Edge Functions for privileged account operations;
- service-role credentials kept outside frontend code;
- administrator-only policies for management tables and audit logs;
- suspended administrator checks;
- row-level security and ownership-based access requirements;
- file type and size validation in relevant upload flows;
- report/post moderation safeguards and distinct-reporter thresholds; and
- database audit triggers for selected profile, report, community-post, and moderation changes.

Before production expansion, the live Supabase schema should be reconciled with the repository SQL files, including all foreign keys, indexes, storage policies, RLS policies, RPCs, triggers, and migration order.

## 10. Testing and evaluation plan

Testing covers:

- citizen registration, login, recovery, reporting, location validation, upload, voting, community, and tracking;
- administrator login, oversight, map display, filtering, manual entry, assignment, scheduling, moderation, access review, audit log, and analysis;
- staff login, assigned-report visibility, attendance, progress, evidence, resolution, and history;
- integration and realtime propagation between the applications;
- role and row-level access restrictions;
- invalid input, file, and permission handling;
- responsive usability on desktop, tablet, and mobile browsers; and
- performance with realistic report, image, and concurrent-user volumes.

The repository currently demonstrates selected automated tests and a successful Admin Portal build. Full cross-application acceptance testing, concurrent realtime load testing, and formal production security verification remain required.

## 11. Limitations and future work

- Automated test coverage is not yet comprehensive across all applications.
- Tshwane is the configured service area; multi-municipality support is future work.
- Static hosting does not provide a complete email/SMS notification service.
- Image compression, resizing, lazy loading, and broader code splitting should be improved.
- Realtime behavior at larger scale requires load testing.
- The exact production RLS and migration history require a formal release record.
- Future releases may add notifications, configurable municipalities/branding, native mobile clients, stronger attendance controls, and predictive analysis.

## 12. Implementation roadmap

Before wider municipal rollout:

1. Reconcile and document the live Supabase schema and deployment order.
2. Complete automated tests for the four application workflows.
3. Execute integration, security, UAT, and load tests using realistic data.
4. Optimise media delivery, lazy loading, and code splitting.
5. Define municipal service-level targets, escalation rules, reassignment authority, and closure authority.
6. Provide administrator, field-staff, and citizen support materials.
7. Conduct usability and trust evaluation with representative users.
8. Add serverless notifications if email or SMS becomes a confirmed requirement.

## 13. Conclusion

TrackServ has evolved into a connected municipal service platform rather than only a citizen reporting page. The Citizen Portal captures and tracks issues, the Administrative Portal governs platform administration, the Management Portal coordinates daily service delivery, and TrackStaff supports field execution. The shared Supabase architecture enables a coherent workflow while providing authentication, storage, trusted functions, security policies, and realtime integration. The remaining priorities are formal production verification, broader automated testing, realistic load testing, media optimisation, and operational procedures.

## 14. Evidence base

This revision was prepared from the project source and documentation, including the existing proposal, Software Requirements Specification, data-model documents, updated PERT chart, citizen/admin/manager/TrackStaff source, Supabase SQL and Edge Functions, package scripts, deployment guidance, and Chapter 5 implementation requirements.
