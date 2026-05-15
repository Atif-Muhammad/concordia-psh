import sys
import os

path = 'admin-panel/src/pages/FeeManagement.jsx'
if not os.path.exists(path):
    print(f"File {path} not found")
    sys.exit(1)

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Look for the second occurrence of type: "challan" which is in the extra challans table
occurrence = 0
for i, line in enumerate(lines):
    if 'type: "challan"' in line:
        occurrence += 1
        if occurrence == 2:
            print(f"Updating line {i+1}")
            lines[i] = line.replace('type: "challan"', 'type: "extraChallan"')
            break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
