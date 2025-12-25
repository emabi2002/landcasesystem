# 🚨 Alert/Flag System Integration Guide

## Overview
The Alert System allows officers at any workflow stage (Steps 1-6) to send alerts requesting:
- **Commentary** from senior staff
- **Advice** on case handling  
- **Direction** on how to proceed

Alerts can be sent to:
- Legal Manager
- Secretary
- Director of Legal Services

---

## Component Created

**File**: `src/components/forms/AlertDialog.tsx`

Features:
- ✅ Select recipient (Manager/Secretary/Director)
- ✅ Select alert type (Advice/Direction/Commentary)
- ✅ Set priority (Normal/Urgent)
- ✅ Add message explaining the request
- ✅ Automatically includes case context
- ✅ Stores in `communications` table
- ✅ Marks alerts as requiring response

---

## How to Integrate into Workflow Pages

### Step 1: Import the Component

Add to the imports section:
```typescript
import { AlertDialog } from '@/components/forms/AlertDialog';
import { AlertTriangle } from 'lucide-react'; // Add to existing lucide imports
```

### Step 2: Add Alert Button to Page Header

Find the header section (typically next to "Add New" buttons) and add:

```typescript
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    {/* Existing title/icon */}
  </div>
  
  <div className="flex gap-2">
    {/* Existing buttons */}
    <Button
      onClick={() => setShowForm(!showForm)}
      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Plus className="h-4 w-4" />
      Add New
    </Button>
    
    {/* ADD THIS: Alert Button */}
    {selectedCaseId && (
      <AlertDialog 
        caseId={selectedCaseId}
        currentStep="Step X: [Step Name]"
      />
    )}
  </div>
</div>
```

**Replace**:
- `selectedCaseId` with your case ID state variable
- `"Step X: [Step Name]"` with the actual step name

---

## Integration by Page

### 1. Directions Page (`/directions`)
```typescript
currentStep="Step 2: Directions"
```
Add after the "Issue Direction" button in the header.

### 2. Allocation Page (`/allocation`)
```typescript
currentStep="Step 3: Case Allocation"
```
Add after the "Allocate Case" button in the header.

### 3. Litigation Page (`/litigation`)
```typescript
currentStep="Step 4: Litigation Workspace"
```
Add after the "Record Filing" button in the header.

### 4. Compliance Page (`/compliance`)
```typescript
currentStep="Step 5: Compliance Tracking"
```
Add after the "Add Compliance" button in the header.

### 5. Closure Page (`/closure`)
```typescript
currentStep="Step 6: Case Closure"
```
Add after the "Close Case" button in the header.

---

## Example Implementation

```typescript
// Full example for Directions page

<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
      <ClipboardList className="h-6 w-6 text-white" />
    </div>
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Step 2: Directions</h1>
      <p className="text-slate-600 mt-1">Authority directions for case handling</p>
    </div>
  </div>

  <div className="flex gap-2">
    <Button
      onClick={() => setShowForm(!showForm)}
      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Plus className="h-4 w-4" />
      Issue Direction
    </Button>
    
    {/* Alert Button - shows only when case is selected */}
    {formData.case_id && (
      <AlertDialog 
        caseId={formData.case_id}
        currentStep="Step 2: Directions"
      />
    )}
  </div>
</div>
```

---

## How Alerts Work

### For Officers Sending Alerts:
1. Click "Send Alert" button on any workflow page
2. Select recipient (Manager/Secretary/Director)
3. Choose type (Advice/Direction/Commentary)
4. Set priority (Normal/Urgent)
5. Write message explaining the request
6. Submit - alert is sent and saved

### For Recipients (Manager/Secretary/Director):
1. Alerts appear in:
   - Dashboard (pending alerts widget)
   - Case detail page (alerts tab)
   - Communications page
2. Can respond with advice/direction
3. Alert marked as responded/resolved
4. Full audit trail maintained

---

## Database Storage

Alerts are stored in the `communications` table with:
- `communication_type`: 'alert'
- `direction`: 'internal'
- `party_type`: 'manager' | 'secretary' | 'director'
- `party_name`: Recipient name
- `subject`: Alert title with priority
- `content`: Full message with context
- `response_required`: true
- `response_status`: 'pending' | 'responded' | 'resolved'
- `priority`: 'normal' | 'urgent'
- `attachments`: Metadata (workflow step, alert type, etc.)

---

## Customization Options

### Custom Trigger Button
```typescript
<AlertDialog 
  caseId={caseId}
  currentStep="Step 2: Directions"
  triggerButton={
    <Button variant="destructive" size="lg">
      🚨 URGENT ALERT
    </Button>
  }
/>
```

### Conditional Display
```typescript
{/* Show only for specific roles */}
{userRole === 'officer' && formData.case_id && (
  <AlertDialog 
    caseId={formData.case_id}
    currentStep="Step 4: Litigation"
  />
)}
```

---

## Testing Checklist

- [ ] Import AlertDialog component
- [ ] Import AlertTriangle icon
- [ ] Add button to header section
- [ ] Test sending alert to Manager
- [ ] Test sending alert to Secretary
- [ ] Test sending alert to Director
- [ ] Test urgent priority
- [ ] Verify alert appears in communications table
- [ ] Check alert shows correct workflow step
- [ ] Verify case context is included

---

## Next Steps

1. ✅ AlertDialog component created
2. ⏳ Integrate into Directions page
3. ⏳ Integrate into Allocation page
4. ⏳ Integrate into Litigation page
5. ⏳ Integrate into Compliance page
6. ⏳ Integrate into Closure page
7. ⏳ Add alerts widget to Dashboard
8. ⏳ Add alerts tab to Case Detail page
9. ⏳ Create alert response functionality

---

**Need Help?** 
- Check example implementation above
- See `src/components/forms/AlertDialog.tsx` for component code
- Test with a sample case to verify functionality

