# PHASE A: ACCESS CONTROL DISCOVERY REPORT
**Date:** Today
**System:** DLPP Legal Case Management System
**Analyst:** Same AI Assistant

---

## EXECUTIVE SUMMARY

✅ **Good News:** RBAC infrastructure EXISTS but is **INCOMPLETE**
⚠️ **Gap:** **DATA SCOPE permissions** are MISSING (critical requirement)
📋 **Action:** Must **EXTEND** existing system, not replace it

---

## 1. EXISTING RBAC INFRASTRUCTURE

### ✅ **Tables Already Implemented:**

| Table | Purpose | Status |
|-------|---------|--------|
| `groups` | Role/Group management | ✅ Exists |
| `modules` | Feature modules | ✅ Exists |
| `group_module_permissions` | CRUD permissions | ✅ Exists |
| `user_groups` | User-to-group mapping | ✅ Exists |
| `audit_logs` | Audit trail | ✅ Exists |

### ✅ **Permissions Implemented:**

Current `group_module_permissions` table includes:
- ✅ `can_create`
- ✅ `can_read`
- ✅ `can_update`
- ✅ `can_delete`
- ✅ `can_print`
- ✅ `can_approve`
- ✅ `can_export`

### ✅ **Default Groups Seeded:**

1. Super Admin
2. Department Admin
3. Case Officer
4. Legal Officer
5. Data Entry Clerk
6. Auditor
7. Manager
8. Reception

### ✅ **23 Modules Defined:**

Including: Dashboard, Case Registration, Case Management, Directions, Case Allocation, Litigation, Compliance Tracking, etc.

### ✅ **RLS Policies:**

- RLS enabled on RBAC tables
- Read policies for users
- Service role policies for admin operations

---

## 2. CRITICAL GAPS (What's Missing)

### ❌ **1. DATA SCOPE System (HIGHEST PRIORITY)**

**Missing Tables:**
- ❌ `data_scopes` - Define scope types (OWN, GROUP, DEPARTMENT, ALL, ASSIGNED)
- ❌ `group_scope_rules` - Map groups to data scopes per module

**Impact:** Users can see ALL cases regardless of ownership - **SECURITY RISK**

### ❌ **2. Fine-Grained Actions**

**Current:** Only module-level permissions (create, read, update, delete)

**Missing Actions:**
- ❌ ALLOCATE (assign cases to officers)
- ❌ RECOMMEND (manager recommendations)
- ❌ DIRECTIVE (issue directions)
- ❌ REASSIGN (reassign cases)
- ❌ CLOSE_CASE (close cases)

**Impact:** Cannot distinguish between "can update case" vs "can allocate case"

### ❌ **3. Case Table Ownership Columns**

**Missing in `cases` table:**
- ❌ `created_group_id` - Group that created the case
- ❌ `assigned_group_id` - Group assigned to case
- ❌ `department_id` - Department ownership

**Current:**
- ✅ `created_by` exists (user ID)
- ✅ `assigned_to` exists (user ID)

**Impact:** Cannot implement GROUP or DEPARTMENT scope rules

### ❌ **4. RLS Policies on Cases Table**

**Status:** Cases table has NO RLS policies for data scope

**Missing Policies:**
- ❌ OWN scope (user can only see their own cases)
- ❌ GROUP scope (user can see group's cases)
- ❌ DEPARTMENT scope
- ❌ ASSIGNED scope (user sees assigned cases)

**Impact:** ANY authenticated user can read ALL cases - **CRITICAL SECURITY FLAW**

### ❌ **5. Functions Table (Optional but Recommended)**

**Missing:** Fine-grained function-level permissions

**Example Use Case:**
- Module: Case Management
  - Function: Create Case
  - Function: Allocate Case
  - Function: Add Recommendation
  - Function: Issue Directive
  - Function: Close Case

**Impact:** Less granular control; harder to audit specific actions

---

## 3. EXISTING IMPLEMENTATION ANALYSIS

### ✅ **Strong Points:**

1. **Well-structured schema** with proper foreign keys
2. **Audit trail** in place
3. **Role-based groups** already defined
4. **Module-level permissions** working
5. **RLS enabled** on RBAC tables
6. **Helper functions** for permission checks exist
7. **Proper indexing** for performance

### ⚠️ **Weaknesses:**

1. **No data scope enforcement**
2. **Cases table not protected** by RLS
3. **Missing specialized actions** (Allocate, Recommend, Directive)
4. **Group ownership not tracked** on cases
5. **Department linkage missing**

---

## 4. DATA SCOPE REQUIREMENTS (From User)

### **Scope Types Needed:**

| Scope Code | Description | Example |
|------------|-------------|---------|
| OWN | User's own records | `created_by = auth.uid()` |
| ASSIGNED | Assigned to user | `assigned_to = auth.uid()` |
| GROUP | User's group records | `created_group_id IN (user's groups)` |
| DEPARTMENT | Department records | `department_id = user's department` |
| ALL | All records | No filter |

### **Example Policies:**

**Basic User (Case Officer):**
- Read Scope: OWN + ASSIGNED
- Create Scope: OWN
- Cannot Allocate, Recommend, Directive

**Manager:**
- Read Scope: GROUP
- Can Allocate, Recommend, Directive
- Approval rights

**Administrator:**
- Read Scope: ALL
- All permissions

---

## 5. ASSESSMENT SUMMARY

### **Overall Grade: C+ (Partially Implemented)**

| Component | Status | Grade |
|-----------|--------|-------|
| RBAC Infrastructure | ✅ Exists | B |
| Data Scope System | ❌ Missing | F |
| Case Table Protection | ❌ Missing | F |
| Permission Actions | 🔶 Partial | C |
| Audit Trail | ✅ Complete | A |
| Admin Console | 🔶 Partial | B |
| Documentation | ✅ Good | B |

---

## 6. RISK ANALYSIS

### **🔴 CRITICAL RISKS (Fix Immediately):**

1. **Any authenticated user can read ALL cases**
   - Violation of data privacy
   - Legal/compliance risk
   - Cannot control "who sees what"

2. **No group/department ownership tracking**
   - Cannot implement team-based access
   - Cannot segregate by division

3. **Missing specialized permissions**
   - Basic user could theoretically allocate cases
   - No separation of duties

### **🟡 MEDIUM RISKS:**

1. **No function-level granularity**
   - Less precise audit trail
   - Harder to troubleshoot permission issues

2. **Missing department mapping**
   - Cannot implement department-based workflows

---

## 7. RECOMMENDED ACTION PLAN

### **Phase B: Design Enhancements (EXTEND, Don't Replace)**

#### **Step 1: Add Data Scope Tables**
```sql
CREATE TABLE data_scopes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,
  description TEXT
);

CREATE TABLE group_scope_rules (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups,
  module_id UUID REFERENCES modules,
  scope_id UUID REFERENCES data_scopes,
  allow BOOLEAN DEFAULT TRUE
);
```

#### **Step 2: Extend Cases Table**
```sql
ALTER TABLE cases ADD COLUMN created_group_id UUID REFERENCES groups(id);
ALTER TABLE cases ADD COLUMN assigned_group_id UUID REFERENCES groups(id);
ALTER TABLE cases ADD COLUMN department_id UUID; -- Or reference departments table
```

#### **Step 3: Add RLS Policies to Cases**
```sql
CREATE POLICY "case_access_policy" ON cases
FOR SELECT USING (
  -- Check user's scope rules and apply filters
  user_can_access_case(auth.uid(), id)
);
```

#### **Step 4: Add Specialized Actions (Optional)**
```sql
ALTER TABLE group_module_permissions
ADD COLUMN can_allocate BOOLEAN DEFAULT FALSE,
ADD COLUMN can_recommend BOOLEAN DEFAULT FALSE,
ADD COLUMN can_directive BOOLEAN DEFAULT FALSE,
ADD COLUMN can_close_case BOOLEAN DEFAULT FALSE;
```

#### **Step 5: Create Scope Enforcement Function**
```sql
CREATE FUNCTION user_can_access_case(user_id UUID, case_id UUID)
RETURNS BOOLEAN
AS $$
  -- Logic to check scope rules
$$;
```

---

## 8. IMPLEMENTATION PRIORITY

### **Must Have (Phase C - Week 1)**
1. ✅ Add data_scopes table
2. ✅ Add group_scope_rules table
3. ✅ Add ownership columns to cases
4. ✅ Create RLS policies on cases
5. ✅ Seed default scopes (OWN, ASSIGNED, GROUP, ALL)

### **Should Have (Phase C - Week 2)**
6. ✅ Add specialized action columns
7. ✅ Update admin console for scope management
8. ✅ Create scope enforcement functions

### **Nice to Have (Phase D)**
9. Functions table (fine-grained actions)
10. Department linkage
11. Advanced scope combinations

---

## 9. COMPATIBILITY CHECK

### **Will Existing Code Break?**

**NO** - Our approach is to **EXTEND**, not replace:

✅ Existing `groups` table remains
✅ Existing `modules` table remains
✅ Existing `group_module_permissions` table remains (add columns)
✅ Existing helper functions enhanced (not replaced)
✅ Current users/permissions continue working

**Migration Strategy:** Additive only (no breaking changes)

---

## 10. NEXT STEPS

### **Immediate Actions:**

1. ✅ **Run Discovery SQL** (RBAC_DISCOVERY_SUPABASE.sql) to confirm current state
2. ✅ **Review this report** with stakeholders
3. ✅ **Approve enhancement plan**
4. ✅ **Proceed to Phase B: Design**

### **Phase B Deliverables:**

- Enhanced database schema with data scopes
- RLS policy specifications
- Updated admin console mockups
- Migration scripts (additive only)

---

## 11. DECISION MATRIX

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Extend Existing** | • Preserves working code<br>• Faster implementation<br>• No data migration | • Some design compromises | ✅ **RECOMMENDED** |
| **Replace Entirely** | • Clean slate<br>• Perfect design | • High risk<br>• Breaking changes<br>• Data migration needed | ❌ Not recommended |
| **Do Nothing** | • No effort | • **CRITICAL SECURITY FLAW**<br>• Compliance violations | ❌ **UNACCEPTABLE** |

---

## 12. STAKEHOLDER SIGN-OFF

**Approval Required To Proceed:**

- [ ] Security Officer - Data scope enforcement critical
- [ ] Legal Team - Privacy/compliance requirements
- [ ] IT Manager - Implementation resources
- [ ] Project Manager - Timeline approval

**Once approved, proceed to:**
→ **Phase B: Enhanced Schema Design**
→ **Phase C: Implementation**
→ **Phase D: Testing**

---

## CONCLUSION

✅ **Foundation EXISTS and is SOLID**
⚠️ **Critical GAP: Data Scope Enforcement MISSING**
📋 **Action: EXTEND existing system with scope rules**
🎯 **Goal: Week 1 - Scope system deployed**

**Status:** READY for Phase B (Design)

---

**Report Generated:** Today
**Next Review:** After stakeholder approval
**Assigned To:** Development Team

---

## APPENDIX A: SQL Discovery Script

Run `RBAC_DISCOVERY_SUPABASE.sql` to verify current state:
- Confirm tables exist
- Check record counts
- Verify RLS status
- Identify gaps

## APPENDIX B: Existing Helper Functions

- `user_has_permission(user_id, module_key, action)`
- `get_user_permissions(user_id)`
- `update_updated_at_column()` trigger

## APPENDIX C: Modules List

23 modules defined including:
- Case Management (critical)
- Directions (critical)
- Allocation (critical)
- Litigation (critical)

All need scope rules applied.

---

**END OF REPORT**
