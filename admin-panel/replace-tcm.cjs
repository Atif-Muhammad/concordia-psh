const fs = require('fs');
const content = fs.readFileSync('src/pages/Academics.jsx', 'utf8');
const lines = content.split('\n');

// Find start and end (0-based)
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('classMapping') && lines[i].includes('TabsContent') && s === -1) {
    s = i;
  }
  if (s !== -1 && lines[i].replace('\r', '').trimEnd() === '          </TabsContent>' && i > s + 10) {
    e = i;
    break;
  }
}

if (s === -1 || e === -1) {
  console.error('Could not find block. s=' + s + ' e=' + e);
  process.exit(1);
}

console.log('Replacing lines', s, 'to', e);

const newBlock = `          <TabsContent value="classMapping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Class Teachers
                </CardTitle>
                {/* ── NEW TCM DIALOG ── */}
                <Dialog
                  open={dialog.type === "classMapping" && dialog.open}
                  onOpenChange={(open) => {
                    setDialog({ type: "classMapping", open });
                    if (!open) {
                      setTcmStaffSearch(""); setTcmStaffResults([]);
                      setTcmSelectedStaff(null); setTcmSelectedProgramId("");
                      setTcmSelectedClassId(""); setTcmClassSubjects([]);
                      setTcmSelectedSubjectIds(new Set());
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("classMapping")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Assign Teacher
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Assign Teacher to Class</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* STEP 1: Staff search */}
                      <div>
                        <Label>Search Staff *</Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                          <Input
                            className="pl-8"
                            placeholder="Type name to search..."
                            value={tcmStaffSearch}
                            onChange={(e) => handleTcmStaffSearch(e.target.value)}
                          />
                        </div>
                        {tcmStaffSearching && (
                          <p className="text-xs text-muted-foreground mt-1">Searching...</p>
                        )}
                        {tcmStaffResults.length > 0 && !tcmSelectedStaff && (
                          <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                            {tcmStaffResults.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
                                onClick={() => {
                                  setTcmSelectedStaff(s);
                                  setTcmStaffSearch(s.name);
                                  setTcmStaffResults([]);
                                }}
                              >
                                <span>{s.name}</span>
                                <Badge variant="secondary" className="text-xs ml-2">
                                  {getTcmStaffRole(s)}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        )}
                        {tcmSelectedStaff && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{tcmSelectedStaff.name}</Badge>
                            <Badge variant="secondary" className="text-xs">{getTcmStaffRole(tcmSelectedStaff)}</Badge>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground underline"
                              onClick={() => {
                                setTcmSelectedStaff(null);
                                setTcmStaffSearch("");
                                setTcmSelectedProgramId("");
                                setTcmSelectedClassId("");
                                setTcmClassSubjects([]);
                                setTcmSelectedSubjectIds(new Set());
                              }}
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>

                      {/* STEP 2: Program filter */}
                      {tcmSelectedStaff && (
                        <div>
                          <Label>Program</Label>
                          <Select
                            value={tcmSelectedProgramId || "all"}
                            onValueChange={(v) => {
                              setTcmSelectedProgramId(v);
                              setTcmSelectedClassId("");
                              setTcmClassSubjects([]);
                              setTcmSelectedSubjectIds(new Set());
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="All Programs" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Programs</SelectItem>
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* STEP 3: Class selection */}
                      {tcmSelectedStaff && (
                        <div>
                          <Label>Class *</Label>
                          <Select
                            value={tcmSelectedClassId}
                            onValueChange={(v) => {
                              setTcmSelectedClassId(v);
                              setTcmSelectedSubjectIds(new Set());
                              loadTcmClassSubjects(v);
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                              {classes
                                .filter((c) =>
                                  !tcmSelectedProgramId || tcmSelectedProgramId === "all" ||
                                  c.programId === Number(tcmSelectedProgramId)
                                )
                                .map((c) => {
                                  const prog = programs.find(p => p.id === c.programId);
                                  return (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                      {c.name} ({prog?.name})
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* STEP 4: Subject checklist */}
                      {tcmSelectedClassId && (
                        <div>
                          <Label className="mb-2 block">Subjects for this class *</Label>
                          {tcmClassSubjectsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading subjects...</p>
                          ) : tcmClassSubjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No subjects mapped to this class yet.</p>
                          ) : (
                            <div className="border rounded-md max-h-52 overflow-y-auto space-y-1 p-2">
                              {tcmClassSubjects.map((scm) => {
                                const subjectId = scm.subject.id;
                                const subjectName = scm.subject.name;
                                const assignedTeachers = scm.subject.teacherMappings || [];
                                const assignedToThisStaff = assignedTeachers.some(
                                  (tm) => tm.teacherId === tcmSelectedStaff?.id
                                );
                                const assignedToOther = assignedTeachers.some(
                                  (tm) => tm.teacherId !== tcmSelectedStaff?.id
                                );
                                const isChecked = tcmSelectedSubjectIds.has(subjectId);

                                return (
                                  <div key={subjectId} className="flex items-center gap-2 py-1">
                                    <Checkbox
                                      id={\`tcm-subj-\${subjectId}\`}
                                      checked={isChecked}
                                      disabled={assignedToOther && !assignedToThisStaff}
                                      onCheckedChange={(checked) => {
                                        setTcmSelectedSubjectIds((prev) => {
                                          const next = new Set(prev);
                                          if (checked) next.add(subjectId);
                                          else next.delete(subjectId);
                                          return next;
                                        });
                                      }}
                                    />
                                    <label
                                      htmlFor={\`tcm-subj-\${subjectId}\`}
                                      className={\`text-sm flex-1 \${assignedToOther && !assignedToThisStaff ? "text-muted-foreground" : "cursor-pointer"}\`}
                                    >
                                      {subjectName}
                                    </label>
                                    {assignedToThisStaff && (
                                      <Badge variant="secondary" className="text-xs">Already assigned</Badge>
                                    )}
                                    {assignedToOther && !assignedToThisStaff && (
                                      <Badge variant="destructive" className="text-xs">
                                        {assignedTeachers.find(tm => tm.teacherId !== tcmSelectedStaff?.id)?.teacher?.name || "Other teacher"}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUBMIT */}
                      <Button
                        className="w-full"
                        onClick={handleTcmBulkSubmit}
                        disabled={
                          !tcmSelectedStaff ||
                          !tcmSelectedClassId ||
                          tcmSelectedSubjectIds.size === 0 ||
                          tcmSubmitting
                        }
                      >
                        {tcmSubmitting ? "Assigning..." : "Assign Teacher"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherClassMappings && teacherClassMappings.map((m) => {
                      const teacher = teachers.find((t) => t.id === m.teacherId);
                      const cls = classes.find((c) => c.id === m.classId);
                      const prog = programs.find((p) => p.id === cls?.programId);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{teacher?.name || "—"}</TableCell>
                          <TableCell>{cls?.name || "—"}</TableCell>
                          <TableCell>{prog?.name || "—"}</TableCell>
                          <TableCell>
                            {m.sectionId
                              ? sections.find(s => s.id === m.sectionId)?.name || "—"
                              : <span className="text-muted-foreground text-xs">All sections</span>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: "classMapping", id: m.id });
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!teacherClassMappings || teacherClassMappings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No teacher-class mappings found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>`;

// Split new block into lines (LF), then add \r to match file style
const newLines = newBlock.split('\n').map(l => l + '\r');

const result = [
  ...lines.slice(0, s),
  ...newLines,
  ...lines.slice(e + 1)
];

fs.writeFileSync('src/pages/Academics.jsx', result.join('\n'), 'utf8');
console.log('Done. New line count:', result.length);
