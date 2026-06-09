#!/bin/bash

# Fix cases/new/page.tsx
sed -i 's/created_by: user\.id,$/created_by: user.id,\n            assigned_officer_id: null,\n          } as never,/' src/app/cases/new/page.tsx
sed -i 's/router\.push(`\/cases\/\${data\.id}`);/if (!data) throw new Error("No data returned");\n\n      toast.success("Case registered successfully!");\n      router.push(`\/cases\/${(data as { id: string }).id}`);/' src/app/cases/new/page.tsx

# Fix form dialogs  
sed -i 's/uploaded_by: user\.id,$/uploaded_by: user.id,\n          } as never,/' src/components/forms/AddDocumentDialog.tsx
sed -i 's/event_type: formData\.event_type,$/event_type: formData.event_type,\n          } as never,/' src/components/forms/AddEventDialog.tsx
sed -i 's/contact_info: contactInfo,$/contact_info: contactInfo,\n          } as never,/' src/components/forms/AddPartyDialog.tsx
sed -i 's/assigned_to: user\.id, \/\/ Assign to current user$/assigned_to: user.id, \/\/ Assign to current user\n          } as never,/' src/components/forms/AddTaskDialog.tsx

echo "All files fixed"
