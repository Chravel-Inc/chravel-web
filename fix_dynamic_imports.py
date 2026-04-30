import re

def fix_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    for pattern, replacement in replacements:
        content = content.replace(pattern, replacement)

    if original != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"No changes in {filepath}")

# For useAuth.tsx, we want to remove the static import
# of useNotificationRealtimeStore if it is also dynamically imported.
# Let's remove the dynamic import block at the end, and just use the statically imported one.
with open('src/hooks/useAuth.tsx', 'r') as f:
    content = f.read()

# Replace the dynamic import block at the end with a simple call or just remove it if it's already done
dynamic_import_block = """    import('@/store/notificationRealtimeStore').then(({ useNotificationRealtimeStore }) => {
      useNotificationRealtimeStore.getState().clearAll();
    });"""

content = content.replace(dynamic_import_block, "")

with open('src/hooks/useAuth.tsx', 'w') as f:
    f.write(content)
print("Removed dynamic useNotificationRealtimeStore import from useAuth.tsx")

# For TripGrid.tsx, we should lazy import UpgradeModal OR static import in Index.tsx.
with open('src/pages/Index.tsx', 'r') as f:
    content = f.read()

content = content.replace("const UpgradeModal = lazy(() =>\n  import('../components/UpgradeModal').then(m => ({ default: m.UpgradeModal })),\n);", "import { UpgradeModal } from '../components/UpgradeModal';")

with open('src/pages/Index.tsx', 'w') as f:
    f.write(content)
print("Fixed UpgradeModal import in Index.tsx")
