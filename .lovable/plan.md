
## Plan: Fix User Management and Enhance Inspector Invitation UI

### Issue 1: Fix "Failed to fetch users" Database Error

**Problem:**  
The `get_users_with_emails` function declares `email text` but `auth.users.email` is `character varying(255)`. PostgreSQL requires exact type matching.

**Solution:**  
Update the database function to cast `au.email::text` so it matches the declared return type.

**Database Migration:**
```sql
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
 RETURNS TABLE(profile_id uuid, user_id uuid, full_name text, email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    au.email::text,  -- Cast to text to match return type
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;
```

---

### Issue 2: Enhance Inspector Invitation UI with Collapsible Property/Template Lists

**Current behavior:**
- Select properties first (checkboxes)
- If inspector, a separate section shows templates grouped by selected properties

**New behavior:**
- For inspector role: Show each property with a collapsible section
- When a property is checked, expand to show its templates indented below
- Add collapse/expand toggle (chevron icon) for each property
- Templates appear in an outline format under their parent property

**File: `src/components/InviteUser.tsx`**

**Changes:**

1. Add imports for Collapsible components and ChevronRight/ChevronDown icons

2. Add state to track expanded properties:
```typescript
const [expandedProperties, setExpandedProperties] = useState<string[]>([]);
```

3. Add toggle function:
```typescript
const togglePropertyExpanded = (propertyId: string) => {
  setExpandedProperties(prev => 
    prev.includes(propertyId) 
      ? prev.filter(id => id !== propertyId)
      : [...prev, propertyId]
  );
};
```

4. For inspector role, replace the two-section layout with a unified property list where:
   - Each property has a checkbox + expand/collapse chevron
   - When property is selected AND inspector role, auto-expand to show templates
   - Templates are indented under the property with checkboxes
   - Collapsible component wraps the template list

5. UI structure for inspector:
```text
[expand/collapse] [x] Property Name - Address
  └─ [ ] Template 1
  └─ [ ] Template 2
  └─ [ ] Template 3

[expand/collapse] [x] Another Property - Address
  └─ [ ] Template A
  └─ [ ] Template B
```

6. Auto-expand property when selected (for inspector role):
```typescript
const toggleProperty = (propertyId: string) => {
  setSelectedProperties(prev => {
    const isCurrentlySelected = prev.includes(propertyId);
    if (isCurrentlySelected) {
      // Remove property and collapse
      setExpandedProperties(current => current.filter(id => id !== propertyId));
      setSelectedTemplatesPerProperty(current => {
        const updated = { ...current };
        delete updated[propertyId];
        return updated;
      });
      return prev.filter(id => id !== propertyId);
    } else {
      // Add property and expand (for inspector)
      if (inviteRole === 'inspector') {
        setExpandedProperties(current => [...current, propertyId]);
      }
      return [...prev, propertyId];
    }
  });
};
```

---

### Issue 3: Pending Invitations - Working Correctly

The PendingInvitations component is functioning properly:
- Fetches from `invitations` table
- Shows invitation status (Pending, Accepted, Expired)
- Allows revoking pending invitations
- Displays "No invitations found" when empty

No changes needed.

---

### Issue 4: Invitation Flow - Working Correctly

The AcceptInvitation flow is properly implemented:
- Validates the invitation token
- Handles both signup and signin modes
- Creates user profile
- Marks invitation as accepted
- Assigns the role from the invitation
- Creates `user_properties` records from `permissions.property_ids`
- Creates `inspector_inspection_permissions` from `permissions.inspection_type_ids`

No changes needed.

---

### Summary of Changes

| File | Change |
|------|--------|
| Database Migration | Fix `get_users_with_emails` function - cast email to text |
| `src/components/InviteUser.tsx` | Implement collapsible property/template UI for inspectors |

### Technical Details

**Collapsible UI Implementation:**

The updated InviteUser component will use:
- `@radix-ui/react-collapsible` via shadcn's Collapsible component (already available)
- ChevronRight/ChevronDown icons to indicate expand/collapse state
- Smooth animation for expanding/collapsing template lists
- Auto-expand when property is selected for inspector role
- Visual indentation using `pl-6` to show hierarchy
