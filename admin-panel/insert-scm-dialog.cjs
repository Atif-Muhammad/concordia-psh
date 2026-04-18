const fs = require('fs');
const content = fs.readFileSync('src/pages/Academics.jsx', 'utf8');
const lines = content.split('\n');

// Find the {/* Delete Confirmation */} line
let idx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Delete Confirmation')) {
    idx = i;
    break;
  }
}

if (idx === -1) {
  console.error('Could not find Delete Confirmation comment');
  process.exit(1);
}

console.log('Inserting SCM dialog before line', idx);

const scmDialog = `          {/* SCM VIEW DIALOG */}
          <Dialog open={!!scmViewItem} onOpenChange={(open) => { if (!open) setScmViewItem(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subject-Class Mapping Details</DialogTitle>
              </DialogHeader>
              {scmViewItem && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject</span>
                    <span className="font-medium">{scmViewItem.subject?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class</span>
                    <span className="font-medium">{scmViewItem.class?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Program</span>
                    <span className="font-medium">{scmViewItem.class?.program?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-medium">{scmViewItem.code || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Hours</span>
                    <span className="font-medium">{scmViewItem.creditHours ?? "—"}</span>
                  </div>
                  {scmViewItem.description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description</span>
                      <span className="font-medium">{scmViewItem.description}</span>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>`;

// Split into lines with \r to match file style
const scmLines = scmDialog.split('\n').map(l => l + '\r');
// Add a blank line after
scmLines.push('\r');

const result = [
  ...lines.slice(0, idx),
  ...scmLines,
  ...lines.slice(idx)
];

fs.writeFileSync('src/pages/Academics.jsx', result.join('\n'), 'utf8');
console.log('Done. New line count:', result.length);
