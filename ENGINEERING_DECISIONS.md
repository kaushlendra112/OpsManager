# Engineering Decisions & Trade-offs

1. **Optimistic Concurrency Control (OCC) with Versioning:**
   - *Decision:* Used a `version` integer column in the `work_items` table. Every update increments the version.
   - *Trade-off:* We avoid pessimistic locking (which could freeze operations and lead to deadlocks in a high-concurrency environment). However, it means users might encounter 409 Conflict errors and have to refresh their data. This is an acceptable UX trade-off for operational systems to ensure data correctness when two agents update a stale item simultaneously.

2. **Database Choice & Connection Handling:**
   - *Decision:* Chosen SQLite via `better-sqlite3` for this implementation due to portability and ease of setup.
   - *Trade-off:* While `better-sqlite3` is synchronous and incredibly fast for local/single-server usage, it won't easily scale horizontally across multiple instances like PostgreSQL would. In a real-world scenario handling thousands of concurrent users across multiple regions, we would migrate to PostgreSQL. The SQL syntax used here is largely compatible for an easy future migration.

3. **Pagination & Search Strategy:**
   - *Decision:* Implemented Server-side pagination (Limit/Offset) and basic `LIKE` search for filtering on the dashboard.
   - *Trade-off:* Limit/Offset degrades in performance for very deep pages (e.g., page 10,000). Cursor-based pagination (Keyset pagination) would be faster for massive datasets but is more complex to implement and limits the ability to jump to an arbitrary page number. Basic `LIKE` is fine for thousands of items, but for tens of thousands, a Full-Text Search index (or Elasticsearch) would be required to prevent slow table scans.

4. **Immutable Audit Logs:**
   - *Decision:* State changes, reassignments, and priority shifts write an immutable record to the `audit_logs` table.
   - *Trade-off:* We duplicate some data over time and the `audit_logs` table will grow much faster than `work_items`. However, an operational system legally/practically needs this traceability. This trades storage space for observability and accountability.

5. **Authorization Enforcement:**
   - *Decision:* Role-based Access Control (RBAC) enforced explicitly on the backend routes (e.g., Viewers cannot execute PUT requests).
   - *Trade-off:* It requires maintaining roles and verifying them on each protected route. We chose to embed user roles in the JWT token for stateless authentication. This speeds up requests (no DB lookup needed for the role), but means role changes aren't reflected until the user's token expires or they log in again.
