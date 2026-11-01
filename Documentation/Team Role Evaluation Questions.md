# TrackServ Team Role Evaluation Questions

These open-ended questions are based on the citizen portal, administrative dashboard, TrackStaff application, and the revised TrackServ proposal and requirements. They assess whether each team member understands the connected system and can explain how their work meets the proposed requirements.

Ask respondents to support their answers with a relevant user flow, design or technical decision, and evidence such as a prototype, implementation, test, or observed result. Where a requirement is not implemented or verified, respondents should identify the gap and explain how it should be addressed.

## Design team

1. How would you guide a citizen from selecting an issue category through describing it, choosing or capturing a location, adding photographs, and confirming a report, while making Tshwane boundary validation understandable?
2. How should the citizen portal, administrative dashboard, and TrackStaff application adapt their layouts and priorities for desktop, tablet, and mobile browsers, especially for map-based and field work?
3. How would you make report status, severity, assignment, overdue state, and resolution evidence easy to distinguish across all three applications without relying on color alone?
4. How should the administrative map and report list help an administrator scan, filter, and prioritize work by severity, age, votes, status, location, and assignee?
5. How would you design the staff workflow so a field worker can identify an assigned issue, start attendance, update progress, upload completion evidence, record a resolution note, and complete work with minimal ambiguity?
6. What interface states should be designed for slow or interrupted connections, unavailable maps, failed image uploads, empty results, permission restrictions, and delayed real-time updates, and how should each state communicate whether data was saved?
7. How would you evaluate accessibility and usability for citizens, administrators, and field staff, including keyboard use, readable text, contrast, map alternatives, and outdoor mobile use?
8. How would you keep terminology, report statuses, categories, and navigation consistent between the three applications while still tailoring each application to its user's responsibilities?
9. How would you present report progress, community participation, and marketplace services where enabled in the citizen portal while keeping civic reporting clear and personal or staff information appropriately private?
10. How would you test the proposed designs with residents, municipal administrators, and field staff, and what evidence would show that users can complete their primary tasks successfully?

## Front-end team

1. How do the citizen portal, administrative dashboard, and TrackStaff application use the shared Supabase backend, and how does a report move through the applications from submission to assignment and resolution?
2. How do authentication, role checks, and route protection work in each application, and what must be enforced by database policies rather than by hiding controls in the interface?
3. How should the citizen reporting form validate required fields, image limits, coordinates, and Tshwane boundary membership, and how should it handle mismatches between client-side and trusted validation?
4. How are report statuses and permitted transitions represented in the applications, and how do the interfaces provide clear feedback when an update is rejected, delayed, or already made elsewhere?
5. How do GPS capture, location search, reverse geocoding, map selection, and boundary validation work together, and what happens when permission or a mapping service is unavailable?
6. How should report and completion images be validated and uploaded, including the proposal's limit of five report images at up to 5 MB each, and how are partial failures or orphaned uploads handled?
7. How are Supabase Realtime subscriptions established, scoped, cleaned up, and recovered after errors or reconnection so users see authorized changes without duplicates or silent data loss?
8. How would you keep report lists, maps, filters, and analytics responsive as the system approaches the proposal's test dataset of at least 1,000 reports and concurrent users?
9. How does the staff application ensure it loads and updates only reports assigned to the authenticated staff member, including after reassignment, without trusting client-supplied identifiers?
10. How are citizen community features and marketplace features where enabled integrated without disrupting the core reporting workflow, and how would you verify their data and error states?

## Database team

1. How do the shared PostgreSQL models connect Supabase Auth users and profiles to citizen reports, staff assignments, categories, report images, resolutions, events, community activity, and marketplace records?
2. How should row-level security allow citizens to access their own records, staff to access assigned work, and administrators to perform authorized management tasks across all three applications?
3. Which database constraints, defaults, and trusted validations should govern roles, report statuses, severity, coordinates, image limits, and allowed workflow transitions, and how should invalid changes be rejected?
4. How should foreign keys and ownership rules preserve the integrity of reports, assignments, groups, report images, issue resolutions, and scheduled events when records are updated or removed?
5. How would you make staff completion reliable when image upload, resolution-record creation, and the report's resolved status involve multiple operations, including recovery from a partial failure?
6. How should the database enforce one vote per user per report and keep the report's vote count correct when votes are added, removed, retried, or submitted concurrently?
7. What audit data should be stored for report creation, assignment and reassignment, attendance, status changes, event scheduling, and resolution, and how would authorized users retrieve that history?
8. Which tables and changes need Realtime publication for the three applications, and how should subscriptions respect row-level access and avoid exposing another citizen's or staff member's data?
9. How would you index and query reports, assignments, events, and analytics to support filtering and workload views, and how would you validate performance with 1,000 varied reports and concurrent Realtime sessions?
10. What migration, generated-type, and policy documentation is needed to resolve the proposal's noted schema gaps, including group membership, resolution uniqueness, attendance history, storage policies, and whether proof data is stored in one or more places?

## QA team

1. How would you test the complete citizen-to-administrator-to-staff-to-citizen workflow, and what evidence would demonstrate that submission, assignment, attendance, completion, and status visibility remain consistent?
2. How would you test authentication and authorization across the three applications, including attempts by citizens to access staff or admin workflows and by staff to access unassigned reports?
3. What boundary and location cases would you test for GPS capture, search, map selection, reverse geocoding, and Tshwane validation, including locations just inside and outside the municipal boundary?
4. How would you verify report form and media rules, including required fields, character limits, up to five report photographs, the 5 MB per-image limit, unsupported file types, and failed or interrupted uploads?
5. How would you test valid and invalid status transitions, including attendance to in-progress, required completion evidence and notes, resolution visibility, and attempts to resolve work prematurely?
6. How would you test Realtime propagation across citizen, administrator, and staff sessions under normal conditions, delayed delivery, disconnection, reconnection, duplicate events, and subscription errors?
7. How would you verify assignment, reassignment, scheduled field events, staff visibility, work history, and administrator workload views for individual staff members and groups where enabled?
8. How would you establish expected results and test the accuracy of report volume, category breakdown, resolution time and rate, overdue reports, and staff workload analytics?
9. How would you evaluate responsive usability and accessibility across the citizen, admin, and staff interfaces, and test community and marketplace behavior where enabled without confusing or breaking core reporting?
10. What performance and reliability test would you run with at least 1,000 reports, varied statuses and ages, images, events, assignments, and concurrent Realtime users, and what measurable results would satisfy the proposal?

## Suggested answers

These are model answers, not the only acceptable responses. They describe the expected system knowledge and proposal alignment. The proposal also identifies items that require confirmation in the live Supabase configuration, so teams should not claim that an unverified control or feature is already implemented.

### Design team

1. Use a guided, clearly ordered form: category, description, optional details and photographs, then location and review. Offer GPS, search, and map selection; explain that the report must be within Tshwane and show how to correct an out-of-boundary location. Confirm successful submission and explain the next status.
2. Keep each interface responsive, but prioritize its main task: accessible reporting and tracking for citizens, dense filtering and map/list operations for administrators, and large, clear, mobile-friendly actions for field staff. Provide usable non-map alternatives and avoid making essential tasks depend on a wide screen.
3. Pair text labels and recognizable icons with color, maintain contrast, and use a consistent status vocabulary. Show severity, assignee, overdue condition, and evidence as separate labeled fields so users can understand them without color or inference.
4. Provide a synchronized map and list with search and filters for category, status, severity, age/date, assignee, and location. Make priority factors visible, support sorting, and let administrators inspect report details and evidence without losing their place.
5. Present assigned issue details and location first, then a clear sequence for attendance/start, in-progress work, evidence and resolution note, and completion. Show required fields, confirmation, current status, and save/error feedback; do not imply resolution succeeded until the system confirms it.
6. Design explicit loading, empty, offline/reconnecting, map-unavailable, upload-progress, upload-failed, permission-denied, and stale-data states. State whether an action was saved, provide retry or recovery where safe, and never show success when persistence is uncertain.
7. Test keyboard navigation and visible focus, screen-reader labels, contrast, scalable text, touch-target size, and plain language. Provide address/details or list alternatives to maps, and test staff workflows on mobile in bright/outdoor conditions and with realistic connectivity.
8. Use shared terminology, identifiers, and status definitions from a common design system or documented reference. Keep navigation and actions role-specific while aligning report details, status labels, category names, and visual treatment across all apps.
9. Keep report submission and tracking prominent. Present voting and community features as secondary, clearly separate marketplace content where enabled, and avoid exposing private citizen details or staff information in public views.
10. Conduct task-based sessions with residents, administrators, and field staff using representative devices and realistic scenarios. Measure completion rate, time, errors, and points of confusion; record feedback and verify improvements in a follow-up test.

### Front-end team

1. All three React applications connect to the same Supabase PostgreSQL, Auth, Storage, and Realtime services. A citizen creates a report; authorized administrators review and assign it; the assigned staff member records progress and resolution evidence; the updated status and resolution become visible to authorized administrators and the reporting citizen.
2. Each app authenticates through Supabase Auth, reads the profile role, and provides role-appropriate navigation and route guards. These client controls improve UX but are not security boundaries: PostgreSQL RLS and Storage policies must enforce ownership, role, and assignment restrictions even for direct API requests.
3. Validate required text/category fields, character limits, image count and size, coordinate presence/range, and boundary membership before submission for immediate feedback. Trusted database/server-side logic must repeat security-sensitive validation; if it disagrees with the client, reject the write, explain the issue, and retain form data so the user can correct it.
4. Use the shared status set and workflow rules (including open, under_review, in_progress, resolved, closed, and rejected as documented) consistently. Confirm changes from the backend, show pending/error states, and refresh from authoritative data after a conflict or remote update instead of assuming a local optimistic change succeeded.
5. GPS, search, and map selection should all produce coordinates; reverse geocoding supplies a readable location, and municipal-boundary validation determines whether it is eligible. If a permission or provider fails, explain the cause and allow another supported method; do not silently accept an unvalidated location.
6. Enforce the proposal's five-image and 5 MB-per-image report limits and accepted file types in the interface, while ensuring Storage policies and trusted validation also enforce them. Track upload and database-record steps; on partial failure, report what succeeded, allow safe retry, and clean up orphaned files through a reliable cleanup process.
7. Subscribe only to relevant authorized records/channels, register clear error handling, and unsubscribe when views unmount or filters/users change. On reconnect or subscription failure, notify the user and reload authoritative data to reconcile missed updates; deduplicate events or make state updates idempotent.
8. Paginate or otherwise bound result sets, select only needed fields, debounce search, avoid rendering all map markers at once where necessary, and lazy-load images or expensive views. Profile with the proposal's 1,000-report dataset and concurrent sessions, measuring query/render responsiveness and Realtime delivery rather than assuming performance.
9. Use the authenticated Supabase user identity to query assigned reports, and rely on RLS policies that compare the authenticated identity to the assignment. Do not trust a client-supplied staff ID; after reassignment, policy and refreshed data should remove access for the former assignee and grant it only to the authorized new assignee.
10. Keep community and marketplace routes/components distinct from the core report workflow and use their own loading, validation, access, and error states. Test that those features work when enabled and that failures or unavailable configuration do not block reporting, tracking, or account-critical flows.

### Database team

1. `auth.users` is the identity source, with a linked `profiles` record containing application role and profile data. Reports reference their reporter and category, while assignment fields link staff/group ownership; report images and issue resolutions reference reports; events associate scheduled work with reports. Community and marketplace tables reference their authors, profiles, categories, or listings as appropriate.
2. Enable RLS on all exposed tables and buckets. Policies should scope citizens to their own private records, staff to reports assigned to their authenticated profile and permitted workflow updates, and administrators to authorized management operations. Verify policies with direct API tests for both allowed and denied cases; role checks in React are supplementary.
3. Use foreign keys, `NOT NULL` and check constraints for required values, enumerated or constrained roles/status/severity, valid coordinate ranges, unique vote keys, and trusted checks for file metadata and transitions. Enforce boundary rules and workflow authorization in a trusted database function or server boundary; reject invalid writes with actionable errors.
4. Define explicit foreign keys from reports to profiles/categories, assignments to valid staff/groups, images and resolutions/events to reports, and audit actors to profiles. Select deliberate delete behavior—usually restrict or soft-delete for operational history—and ensure ownership cannot be changed to an unauthorized user through client writes.
5. Make completion a trusted, retry-safe workflow: validate and store the evidence, create or update the resolution record, and update report status only when required details exist. Use a transaction/RPC for related database changes; Storage upload is separate, so track failure, retry idempotently, and provide cleanup for unreferenced objects before marking the report resolved.
6. Add a unique constraint on `(report_id, user_id)` and perform vote toggling transactionally through a database function. Derive the count from vote rows or update it atomically in the same transaction, so concurrent requests and retries cannot double-count; test repeated add/remove and concurrent attempts.
7. Store actor ID, report ID, old/new values or action, and UTC timestamp for creation, assignment/reassignment, attendance, status changes, events, evidence, and resolution. Make audit records append-only to ordinary users and expose filtered history only to authorized administrators and relevant staff.
8. Publish tables needed for report, assignment, event, and resolution updates, and configure client subscriptions to the narrowest practical scope. RLS must govern data visibility; do not assume Realtime filters alone are an access-control mechanism. Test that unauthorized clients cannot retrieve protected rows or payloads.
9. Add indexes for common foreign-key and filter fields such as report status/category/assignee/created date, event report/date, and resolution report. Use paginated queries and measured query plans; validate correctness and latency with varied 1,000-report data and concurrent Realtime clients.
10. Maintain versioned migrations, generated database types, documented relationships and constraints, and tests for RLS and Storage policies. Explicitly resolve the proposal's open questions about groups/membership, unique resolution records, attendance history, foreign-key behavior, indexes, vote-count logic, proof-image duplication, and role/status constraints.

### QA team

1. Create end-to-end scenarios for citizen submission, admin receipt and assignment, staff receipt and attendance, evidence/note submission, resolution, and citizen/admin visibility. Verify database state, UI state in each role, timestamps, uploaded evidence, and Realtime updates, including failure and retry cases.
2. Test valid and invalid login/role combinations, protected routes, direct URL access, direct API requests, and record-level access. Confirm citizens cannot manage staff/admin data and staff cannot read or change unassigned reports, including after reassignment; verify denial comes from backend policy, not just hidden UI.
3. Test valid locations, boundary-edge points inside and outside Tshwane, missing or inaccurate GPS, denied permissions, search failures, reverse-geocoding failures, and map selection. Confirm the same trusted boundary rule governs submission and that the user receives clear recovery guidance.
4. Test empty and maximum allowed inputs, character limits, zero through six images, files at and above 5 MB, accepted and rejected formats, corrupted files, interrupted uploads, and retry behavior. Verify no false success, no duplicate records, and no orphaned media that cannot be reconciled.
5. Verify allowed transitions and their timestamps, including attendance to in-progress and completion to resolved only after required evidence and resolution details exist. Attempt invalid transitions, missing fields, unauthorized edits, and concurrent updates; confirm clear rejection and consistent final state.
6. With citizen, administrator, and staff sessions open, trigger report, assignment, status, event, and resolution changes. Measure normal propagation, then simulate disconnect/reconnect, delayed messages, duplicate events, and subscription errors; confirm recovery by refresh/reconciliation and no silent data loss or unauthorized exposure.
7. Create test users, reports, individual and group assignments where supported, and scheduled events. Verify correct staff visibility before and after reassignment, event details, work history/timestamps, and administrator workload counts. Mark group behavior as unverified if membership support is not present in the configured schema.
8. Define each metric precisely, including date range, included statuses, overdue threshold, and resolution start/end timestamps. Calculate expected results from a controlled dataset, compare dashboard totals and breakdowns, and check edge cases such as zero reports, reopened reports, and missing timestamps.
9. Test representative phone/tablet/desktop sizes, keyboard and screen-reader flows, contrast, focus, touch targets, and alternatives to map interaction. Test community/marketplace features where enabled and verify their errors or empty states do not interfere with core reporting or leak private data.
10. Seed at least 1,000 reports with varied statuses/ages, assignments, events, and image references; exercise filtering, maps, analytics, and multiple concurrent Realtime clients. Record response/render times, propagation delay, error rates, and data correctness against agreed thresholds; the proposal requires this test but does not specify numeric latency targets, so stakeholders must set them before acceptance.
