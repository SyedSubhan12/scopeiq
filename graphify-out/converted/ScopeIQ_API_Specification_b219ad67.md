<!-- converted from ScopeIQ_API_Specification.docx -->

ScopeIQ
REST API Specification
Novabots Engineering  |  v1.0  |  2026  |  Confidential
Base URL: https://api.scopeiq.com/v1

# 1. API Overview
The ScopeIQ API is a RESTful JSON API built on Hono v4, running on Node.js 20 LTS. All endpoints require authentication via Supabase JWT tokens passed in the Authorization header. Every request is scoped to the authenticated user's workspace via middleware-injected workspaceId.
## 1.1 Base Configuration
## 1.2 Standard Error Codes

# 2. Workspace & Auth Endpoints
### GET /workspaces/me

### PATCH /workspaces/me

### POST /workspaces/me/logo

# 3. Project Endpoints
### GET /projects

### POST /projects

### GET /projects/:id

### PATCH /projects/:id

### DELETE /projects/:id

# 4. Client Endpoints
### GET /clients

### POST /clients

# 5. Brief Builder Endpoints
### GET /brief-templates

### POST /brief-templates

### POST /briefs/submit (Public)

### GET /projects/:projectId/briefs

### GET /briefs/:id

### POST /briefs/:id/override

# 6. Approval Portal Endpoints
### POST /projects/:projectId/deliverables

### POST /deliverables/:id/upload-url

### POST /deliverables/:id/confirm-upload

### POST /deliverables/:id/feedback (Portal)

### POST /deliverables/:id/approve (Portal)

### PATCH /feedback/:id/resolve

### POST /deliverables/:id/summarize-feedback

# 7. Scope Guard Endpoints
### POST /projects/:projectId/sow

### GET /sow/:id

### PATCH /sow/:id/clauses/:clauseId

### POST /sow/:id/activate

### GET /projects/:projectId/scope-flags

### POST /scope-flags/:id/confirm

### POST /scope-flags/:id/dismiss

### POST /scope-flags/:id/snooze

# 8. Change Order Endpoints
### GET /projects/:projectId/change-orders

### PATCH /change-orders/:id

### POST /change-orders/:id/send

### POST /change-orders/:id/accept (Portal)

### POST /change-orders/:id/decline (Portal)

# 9. Webhook & Integration Endpoints
### POST /webhooks/stripe
Handled events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.paid

### POST /webhooks/resend

### POST /messages/ingest

# 10. Rate Card Endpoints
### GET /rate-card

### POST /rate-card

# 11. Audit Log Endpoint
### GET /audit-log
| Base URL | https://api.scopeiq.com/v1 |
| --- | --- |
| Content-Type | application/json |
| Auth Header | Authorization: Bearer <supabase_jwt> |
| Rate Limit | 100 requests/minute per workspace (429 on exceed) |
| Pagination | cursor-based: ?cursor=<id>&limit=<n> (default 20, max 100) |
| Sorting | ?sort=created_at&order=desc |
| Soft Deletes | DELETE returns 204; records retain data with deleted_at set |
| Error Format | { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } } |
| Status | Code | Description |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Request body/params failed Zod validation |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 403 | FORBIDDEN | User lacks permission for this action |
| 404 | NOT_FOUND | Resource does not exist or belongs to another workspace |
| 409 | CONFLICT | Duplicate resource or state conflict |
| 422 | UNPROCESSABLE | Valid request but cannot process (e.g., SOW not active) |
| 429 | RATE_LIMITED | Too many requests; retry after Retry-After header value |
| 500 | INTERNAL_ERROR | Server error; logged to Sentry with correlation ID |
| Method | GET |
| --- | --- |
| Path | /v1/workspaces/me |
| Description | Returns the current user's workspace with plan, settings, and onboarding state. |
| Auth | Bearer JWT (workspace member+) |
| Response | { "data": { "id", "name", "slug", "plan", "logo_url", "brand_color", "custom_domain", "settings_json", "onboarding_progress", "features" } } |
| Status Codes | 200 OK, 401 Unauthorized |
| Method | PATCH |
| --- | --- |
| Path | /v1/workspaces/me |
| Description | Update workspace settings, branding, or onboarding progress. |
| Auth | Bearer JWT (workspace owner/admin) |
| Request Body | { "name"?, "brand_color"?, "custom_domain"?, "settings_json"?, "onboarding_progress"? } |
| Response | { "data": { ...updated workspace } } |
| Status Codes | 200 OK, 400 Validation, 403 Forbidden |
| Method | POST |
| --- | --- |
| Path | /v1/workspaces/me/logo |
| Description | Request a presigned R2 upload URL for the workspace logo. |
| Auth | Bearer JWT (owner/admin) |
| Request Body | { "file_name": "logo.png", "content_type": "image/png" } |
| Response | { "data": { "upload_url": "https://...", "object_key": "logos/ws_xxx/logo.png" } } |
| Status Codes | 200 OK, 400 Invalid file type |
| Method | GET |
| --- | --- |
| Path | /v1/projects?status=active&cursor=...&limit=20 |
| Description | List all projects in the workspace with optional status filter. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "name", "status", "client": { "id", "name" }, "revision_limit", "budget", "start_date", "end_date", "created_at" }], "pagination": { "next_cursor", "has_more" } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/projects |
| Description | Create a new project linked to a client. |
| Auth | Bearer JWT (member+) |
| Request Body | { "name": "Brand Identity", "client_id": "uuid", "budget"?: 12000, "start_date"?: "2026-01-15", "end_date"?: "2026-03-28", "revision_limit"?: 4 } |
| Response | { "data": { ...project, "portal_token": "generated_token" } } |
| Status Codes | 201 Created, 400 Validation, 404 Client not found |
| Method | GET |
| --- | --- |
| Path | /v1/projects/:id |
| Description | Get full project details including linked brief, deliverables count, and scope status. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { ...project, "brief_summary": { "latest_score", "status" }, "deliverable_counts": { "total", "approved", "in_review" }, "scope_flags_pending": 2, "change_orders_pending": 1 } } |
| Status Codes | 200 OK, 404 Not Found |
| Method | PATCH |
| --- | --- |
| Path | /v1/projects/:id |
| Description | Update project details or status. |
| Auth | Bearer JWT (member+) |
| Request Body | { "name"?, "status"?, "budget"?, "start_date"?, "end_date"?, "revision_limit"? } |
| Response | { "data": { ...updated project } } |
| Status Codes | 200 OK, 400 Validation, 404 Not Found |
| Method | DELETE |
| --- | --- |
| Path | /v1/projects/:id |
| Description | Soft-delete a project (sets deleted_at). Requires owner/admin role. |
| Auth | Bearer JWT (owner/admin) |
| Response | No content |
| Status Codes | 204 No Content, 403 Forbidden, 404 Not Found |
| Method | GET |
| --- | --- |
| Path | /v1/clients?cursor=...&limit=20 |
| Description | List all clients in the workspace. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "name", "email", "company", "project_count" }], "pagination": {...} } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/clients |
| Description | Create a new client contact. |
| Auth | Bearer JWT (member+) |
| Request Body | { "name": "Acme Corp", "email": "contact@acme.com", "company"?: "Acme Corporation", "phone"?: "+1..." } |
| Response | { "data": { ...client, "portal_token": "generated" } } |
| Status Codes | 201 Created, 400 Validation, 409 Email exists |
| Method | GET |
| --- | --- |
| Path | /v1/brief-templates |
| Description | List all brief templates for the workspace. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "name", "project_type", "clarity_threshold", "is_published", "field_count" }] } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/brief-templates |
| Description | Create a new brief intake template with field definitions. |
| Auth | Bearer JWT (member+) |
| Request Body | { "name": "Brand Design Brief", "project_type"?: "branding", "fields_json": [{ "key": "project_name", "type": "text", "label": "Project Name", "required": true, "conditions"?: [...] }], "clarity_threshold"?: 70 } |
| Response | { "data": { ...template } } |
| Status Codes | 201 Created, 400 Validation |
| Method | POST |
| --- | --- |
| Path | /v1/briefs/submit |
| Description | Public endpoint for clients to submit a brief response. Rate-limited to 10/hour per IP. |
| Auth | No auth (public, rate-limited) |
| Request Body | { "template_id": "uuid", "responses": [{ "field_key": "project_name", "value": "My Project" }, { "field_key": "budget", "value": "10000" }] } |
| Response | { "data": { "brief_id": "uuid", "message": "Brief submitted successfully. You will receive a confirmation email." } } |
| Status Codes | 201 Created, 400 Validation, 429 Rate Limited |
| Method | GET |
| --- | --- |
| Path | /v1/projects/:projectId/briefs |
| Description | List all brief versions for a project with clarity scores. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "version", "status", "clarity_score", "submitted_at", "flag_count" }] } |
| Status Codes | 200 OK |
| Method | GET |
| --- | --- |
| Path | /v1/briefs/:id |
| Description | Get full brief with all fields, AI flags, and scoring details. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { "id", "version", "status", "clarity_score", "fields": [{ "field_key", "label", "value", "ai_flag", "ai_flag_reason", "ai_suggested_question" }] } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/briefs/:id/override |
| Description | Override an auto-held brief (approve despite low clarity score). |
| Auth | Bearer JWT (member+) |
| Request Body | { "reason": "Client confirmed details verbally" } |
| Response | { "data": { ...brief with status: "approved" } } |
| Status Codes | 200 OK, 422 Brief not in held state |
| Method | POST |
| --- | --- |
| Path | /v1/projects/:projectId/deliverables |
| Description | Create a new deliverable entry. For file uploads, first request a presigned URL. |
| Auth | Bearer JWT (member+) |
| Request Body | { "title": "Logo System v3", "type": "file", "description"?: "Final logo variations" } OR { "title": "Brand Board", "type": "figma", "embed_url": "https://figma.com/..." } |
| Response | { "data": { ...deliverable } } |
| Status Codes | 201 Created, 400 Validation |
| Method | POST |
| --- | --- |
| Path | /v1/deliverables/:id/upload-url |
| Description | Get a presigned R2 upload URL for the deliverable file. |
| Auth | Bearer JWT (member+) |
| Request Body | { "file_name": "logo-v3.pdf", "content_type": "application/pdf", "file_size": 2500000 } |
| Response | { "data": { "upload_url": "https://r2.scopeiq.com/...", "object_key": "deliverables/..." } } |
| Status Codes | 200 OK, 400 File too large (>500MB) |
| Method | POST |
| --- | --- |
| Path | /v1/deliverables/:id/confirm-upload |
| Description | Confirm file upload completion. Updates deliverable with file metadata. |
| Auth | Bearer JWT (member+) |
| Request Body | { "object_key": "deliverables/ws_xxx/del_xxx/logo-v3.pdf" } |
| Response | { "data": { ...deliverable with file_url, file_size_bytes, status: "in_review" } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/portal/deliverables/:id/feedback |
| Description | Client submits feedback on a deliverable. Increments revision round. |
| Auth | Portal token (via project portal_token) |
| Request Body | { "items": [{ "content": "Make the logo larger", "x_pos"?: 45.2, "y_pos"?: 30.1, "page_number"?: 1 }], "overall_note"?: "Looking good, minor tweaks needed", "action": "revision_requested" } |
| Response | { "data": { "feedback_count": 3, "revision_round": 2, "remaining_rounds": 2 } } |
| Status Codes | 200 OK, 400 Validation |
| Method | POST |
| --- | --- |
| Path | /v1/portal/deliverables/:id/approve |
| Description | Client approves a deliverable version. |
| Auth | Portal token |
| Request Body | { "note"?: "Looks perfect!" } |
| Response | { "data": { ...deliverable with status: "approved" } } |
| Status Codes | 200 OK |
| Method | PATCH |
| --- | --- |
| Path | /v1/feedback/:id/resolve |
| Description | Agency resolves a feedback item (hides from client, preserved in history). |
| Auth | Bearer JWT (member+) |
| Request Body | No body required |
| Response | { "data": { ...feedback with is_resolved: true, resolved_at } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/deliverables/:id/summarize-feedback |
| Description | Dispatch AI job to summarize all feedback into a prioritized task list. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { "job_id": "uuid", "status": "queued" } } |
| Status Codes | 202 Accepted (async — result pushed via Supabase real-time) |
| Method | POST |
| --- | --- |
| Path | /v1/projects/:projectId/sow |
| Description | Upload a SOW for AI parsing. Accepts PDF upload or plain text. |
| Auth | Bearer JWT (member+) |
| Request Body | { "raw_text": "Full SOW text..." } OR use presigned URL flow for PDF upload |
| Response | { "data": { "sow_id": "uuid", "status": "parsing", "job_id": "uuid" } } |
| Status Codes | 201 Created, 422 Active SOW already exists |
| Method | GET |
| --- | --- |
| Path | /v1/sow/:id |
| Description | Get parsed SOW with all extracted clauses grouped by type. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { "id", "status", "parsed_at", "clauses": { "deliverables": [...], "revision_limits": [...], "exclusions": [...], "timeline": [...], "payment_terms": [...] } } } |
| Status Codes | 200 OK |
| Method | PATCH |
| --- | --- |
| Path | /v1/sow/:id/clauses/:clauseId |
| Description | Edit a parsed clause before activation. |
| Auth | Bearer JWT (member+) |
| Request Body | { "content"?: "Updated clause text", "clause_type"?: "exclusion", "is_active"?: false } |
| Response | { "data": { ...updated clause } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/sow/:id/activate |
| Description | Activate the SOW for real-time scope monitoring. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { ...sow with status: "active", "clause_summary": { "deliverables": 6, "exclusions": 3, "revision_limits": 1, ... } } } |
| Status Codes | 200 OK, 422 No clauses defined |
| Method | GET |
| --- | --- |
| Path | /v1/projects/:projectId/scope-flags?status=pending |
| Description | List scope flags for a project with optional status filter. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "message_text", "confidence", "severity", "status", "sow_clause": { "content", "section_reference" }, "ai_suggested_response", "created_at" }] } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/scope-flags/:id/confirm |
| Description | Confirm a scope flag as out-of-scope. Triggers change order generation. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { "scope_flag": { ...flag with status: "confirmed" }, "change_order": { "id", "title", "work_description", "price", "status": "draft" } } } |
| Status Codes | 200 OK, 422 Flag already resolved |
| Method | POST |
| --- | --- |
| Path | /v1/scope-flags/:id/dismiss |
| Description | Dismiss a scope flag as in-scope (trains AI). |
| Auth | Bearer JWT (member+) |
| Request Body | { "reason": "This was discussed verbally and falls within the logo system deliverable" } |
| Response | { "data": { ...flag with status: "dismissed" } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/scope-flags/:id/snooze |
| Description | Defer flag for 24 hours. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { ...flag with status: "snoozed", "snoozed_until": "ISO timestamp" } } |
| Status Codes | 200 OK |
| Method | GET |
| --- | --- |
| Path | /v1/projects/:projectId/change-orders |
| Description | List all change orders for a project. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "title", "price", "status", "sent_at", "signed_at" }] } |
| Status Codes | 200 OK |
| Method | PATCH |
| --- | --- |
| Path | /v1/change-orders/:id |
| Description | Edit a draft change order before sending to client. |
| Auth | Bearer JWT (member+) |
| Request Body | { "title"?, "work_description"?, "estimated_hours"?, "price"?, "revised_timeline"? } |
| Response | { "data": { ...updated change_order } } |
| Status Codes | 200 OK, 422 Cannot edit non-draft CO |
| Method | POST |
| --- | --- |
| Path | /v1/change-orders/:id/send |
| Description | Send the change order to the client via portal and email. |
| Auth | Bearer JWT (member+) |
| Response | { "data": { ...co with status: "sent", "sent_at", "pdf_url" } } |
| Status Codes | 200 OK, 422 CO not in draft status |
| Method | POST |
| --- | --- |
| Path | /v1/portal/change-orders/:id/accept |
| Description | Client accepts a change order. Auto-updates SOW scope. |
| Auth | Portal token |
| Request Body | { "signer_name": "John Smith" } |
| Response | { "data": { ...co with status: "accepted", "signed_at" } } |
| Status Codes | 200 OK, 422 Already resolved |
| Method | POST |
| --- | --- |
| Path | /v1/portal/change-orders/:id/decline |
| Description | Client declines a change order. |
| Auth | Portal token |
| Request Body | { "reason"?: "Budget constraints" } |
| Response | { "data": { ...co with status: "declined" } } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/webhooks/stripe |
| Description | Stripe webhook receiver. Verifies signature via STRIPE_WEBHOOK_SECRET. |
| Auth | Stripe Signature header |
| Request Body | Raw Stripe event payload |
| Response | 200 OK (always, to prevent retry storms) |
| Status Codes | 200 OK, 400 Invalid Signature |
| Method | POST |
| --- | --- |
| Path | /v1/webhooks/resend |
| Description | Resend email delivery webhook for tracking reminder delivery status. |
| Auth | Resend Signing Secret |
| Request Body | Resend event payload |
| Response | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/messages/ingest |
| Description | Ingest a client message for scope checking. Dispatches BullMQ job. |
| Auth | Bearer JWT (member+) |
| Request Body | { "project_id": "uuid", "message_text": "Can we also get social media templates?", "source": "manual_input" } |
| Response | { "data": { "job_id": "uuid", "status": "queued" } } |
| Status Codes | 202 Accepted |
| Method | GET |
| --- | --- |
| Path | /v1/rate-card |
| Description | Get all rate card items for the workspace. |
| Auth | Bearer JWT (member+) |
| Response | { "data": [{ "id", "service_type", "description", "hourly_rate", "unit", "is_default" }] } |
| Status Codes | 200 OK |
| Method | POST |
| --- | --- |
| Path | /v1/rate-card |
| Description | Add a new rate card entry. |
| Auth | Bearer JWT (owner/admin) |
| Request Body | { "service_type": "Design", "hourly_rate": 150.00, "description"?: "Brand and visual design work", "unit"?: "hour", "is_default"?: false } |
| Response | { "data": { ...rate_card_item } } |
| Status Codes | 201 Created |
| Method | GET |
| --- | --- |
| Path | /v1/audit-log?entity_type=scope_flag&entity_id=uuid&limit=50 |
| Description | Query the workspace audit trail with optional entity and action filters. |
| Auth | Bearer JWT (admin+) |
| Response | { "data": [{ "id", "actor_id", "actor_type", "entity_type", "entity_id", "action", "metadata_json", "created_at" }], "pagination": {...} } |
| Status Codes | 200 OK, 403 Requires admin role |