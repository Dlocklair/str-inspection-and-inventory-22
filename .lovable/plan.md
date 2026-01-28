

## Plan: Property Photo Field Enhancement and Inspector Inspection Assignment

This plan addresses two requests:
1. Enlarge photo fields on the Properties page by 50% and add image downsizing to save memory
2. Allow per-property inspection assignment when inviting inspectors

---

### Part 1: Property Photo Field Enlargement and Image Optimization

#### 1.1 Enlarge Photo Fields (50% larger)

**File: `src/components/PropertyManager.tsx`**

**Current sizes:**
- Properties table image: `w-16 h-16` (64px x 64px)
- Form preview image: `w-32` (128px)

**New sizes (50% larger):**
- Properties table image: `w-24 h-24` (96px x 96px)
- Form preview image: `w-48` (192px)

**Changes:**

1. **Properties table (lines 458-472):**
   - Change `w-16 h-16` to `w-24 h-24` for both the image and placeholder

2. **Form preview (lines 373-394):**
   - Change `w-32` to `w-48` for the image container

#### 1.2 Add Image Downsizing Before Upload

Add a utility function to resize images before uploading to Supabase storage. This will:
- Resize images to a maximum dimension of 400x400 pixels
- Compress using canvas with JPEG quality of 0.8
- Convert to optimized format

**Changes in `src/components/PropertyManager.tsx`:**

1. Add a new `resizeImage` function:
```typescript
const resizeImage = (file: File, maxSize: number = 400): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        },
        'image/jpeg',
        0.8 // Quality
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
```

2. Modify `handleSubmit` (around line 96-112) to use the resize function before upload:
```typescript
if (imageFile) {
  const resizedBlob = await resizeImage(imageFile);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(filePath, resizedBlob, {
      contentType: 'image/jpeg'
    });
  // ... rest of upload logic
}
```

---

### Part 2: Per-Property Inspection Assignment for Inspectors

This enhancement allows owners to assign specific inspection templates for each property when inviting an inspector.

#### 2.1 Update InviteUser Component UI

**File: `src/components/InviteUser.tsx`**

**Current behavior:**
- Select properties first
- Then select templates from ALL selected properties combined

**New behavior:**
- Select properties first
- For each selected property, show a nested list of that property's templates
- Allow selecting specific templates per property

**Changes:**

1. Update state to track per-property template selections:
```typescript
// Change from:
const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

// To a map of property ID -> template IDs:
const [selectedTemplatesPerProperty, setSelectedTemplatesPerProperty] = 
  useState<Record<string, string[]>>({});
```

2. Fetch templates from Supabase instead of localStorage (they exist in the database):
```typescript
const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from('inspection_templates')
    .select('id, name, property_id')
    .not('property_id', 'is', null)
    .order('name');
  
  if (!error && data) {
    setTemplates(data);
  }
};
```

3. Reorganize the template selection UI to show templates grouped by property:
```tsx
{inviteRole === 'inspector' && selectedProperties.length > 0 && (
  <div>
    <Label className="mb-2 block">Assign Inspection Templates per Property *</Label>
    <div className="space-y-4 max-h-80 overflow-y-auto border rounded-md p-3">
      {selectedProperties.map(propertyId => {
        const property = properties.find(p => p.id === propertyId);
        const propertyTemplates = templates.filter(t => t.property_id === propertyId);
        const selectedForProperty = selectedTemplatesPerProperty[propertyId] || [];
        
        return (
          <div key={propertyId} className="border-b pb-3 last:border-b-0">
            <div className="font-medium flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4" />
              {property?.name}
            </div>
            <div className="pl-6 space-y-2">
              {propertyTemplates.map(template => (
                <div key={template.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`template-${propertyId}-${template.id}`}
                    checked={selectedForProperty.includes(template.id)}
                    onCheckedChange={() => toggleTemplateForProperty(propertyId, template.id)}
                  />
                  <label htmlFor={`template-${propertyId}-${template.id}`} 
                         className="text-sm cursor-pointer">
                    {template.name}
                  </label>
                </div>
              ))}
              {propertyTemplates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No templates available for this property
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

4. Add helper function for toggling templates per property:
```typescript
const toggleTemplateForProperty = (propertyId: string, templateId: string) => {
  setSelectedTemplatesPerProperty(prev => {
    const current = prev[propertyId] || [];
    const updated = current.includes(templateId)
      ? current.filter(id => id !== templateId)
      : [...current, templateId];
    return { ...prev, [propertyId]: updated };
  });
};
```

5. Update validation to check templates are selected for at least one property:
```typescript
if (inviteRole === 'inspector') {
  const allSelectedTemplates = Object.values(selectedTemplatesPerProperty).flat();
  if (allSelectedTemplates.length === 0) {
    toast({ ... 'Please select at least one inspection template' });
    return;
  }
}
```

6. Update form submission to send the flat list of all selected template IDs:
```typescript
const allSelectedTemplates = Object.values(selectedTemplatesPerProperty).flat();
// Send as inspectionTypeIds
```

#### 2.2 Update Edge Function (Optional Enhancement)

**File: `supabase/functions/create-user-invitation/index.ts`**

Update to also store `propertyIds` in the invitation permissions:
```typescript
if (role === 'inspector') {
  await supabase
    .from("invitations")
    .update({ 
      permissions: { 
        property_ids: propertyIds,
        inspection_type_ids: inspectionTypeIds 
      } 
    })
    .eq("id", invitation.id);
}
```

#### 2.3 Update AcceptInvitation to Create Property Assignments

**File: `src/pages/AcceptInvitation.tsx`**

Add property assignment when accepting the invitation:
```typescript
// After creating the user role, also assign properties
if (invitation.permissions?.property_ids) {
  const propertyAssignments = invitation.permissions.property_ids.map((propId: string) => ({
    user_id: profile.id,
    property_id: propId,
    assigned_by: invitation.owner_id,
  }));
  
  await supabase
    .from("user_properties")
    .insert(propertyAssignments);
}
```

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/PropertyManager.tsx` | Enlarge photo fields 50%, add image resize function |
| `src/components/InviteUser.tsx` | Per-property template selection UI, fetch from Supabase |
| `supabase/functions/create-user-invitation/index.ts` | Store propertyIds in permissions |
| `src/pages/AcceptInvitation.tsx` | Create user_properties assignments on invitation acceptance |

---

### Technical Notes

**Image Downsizing:**
- Uses HTML5 Canvas API for client-side resizing
- Targets 400x400 max dimension (suitable for thumbnails)
- JPEG compression at 80% quality balances size/quality
- Original aspect ratio is preserved

**Per-Property Template Assignment:**
- Templates are already linked to properties via `property_id` column in `inspection_templates`
- The `inspector_inspection_permissions` table stores which templates an inspector can access
- Combined with `user_properties`, this gives fine-grained control per property

