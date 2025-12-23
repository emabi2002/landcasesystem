#!/bin/bash

# AddDocumentDialog - fix line 101-102
sed -i '101,102d' src/components/forms/AddDocumentDialog.tsx
sed -i '100a\          } as never,\n        ]);' src/components/forms/AddDocumentDialog.tsx

# AddEventDialog - fix line 57-59
sed -i '/} as never,/,/},/d' src/components/forms/AddEventDialog.tsx
sed -i '56a\          } as never,\n        ]);' src/components/forms/AddEventDialog.tsx

# AddPartyDialog - fix line 53-55  
sed -i '/} as never,/,/},/d' src/components/forms/AddPartyDialog.tsx
sed -i '52a\          } as never,\n        ]);' src/components/forms/AddPartyDialog.tsx

# AddTaskDialog - fix line 57-60
sed -i '/} as never,/,/},/d' src/components/forms/AddTaskDialog.tsx
sed -i '56a\          } as never,\n        ]);' src/components/forms/AddTaskDialog.tsx

echo "Fixed all forms"
