import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Upload, X, Eye, Edit, Trash2, IdCard, Check, Plus,
    Trash, TrendingUp, Calendar as CalendarIcon, Undo2,
    Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const StudentForm = ({
    initialData = {},
    onSubmit,
    onCancel,
    isEditing = false,
    programs = [],
    classes = [],
    sections = [],
    headerExtra = null,
    getLatestRollNumber, // function to fetch latest roll number
    isSubmitting = false
}) => {
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        fName: "",
        mName: "",
        lName: "",
        fatherOrguardian: "",
        rollNumber: "",
        parentOrGuardianEmail: "",
        parentOrGuardianPhone: "",
        address: "",
        gender: "",
        dob: "",
        programId: "",
        classId: "",
        sectionId: "",
        tuitionFee: "",
        numberOfInstallments: "1",
        lateFeeFine: 0,
        installments: initialData.feeInstallments || [],
        documents: {},
        ...initialData
    });

    useEffect(() => {
        setFormData({
            fName: "",
            mName: "",
            lName: "",
            fatherOrguardian: "",
            rollNumber: "",
            parentOrGuardianEmail: "",
            parentOrGuardianPhone: "",
            address: "",
            gender: "",
            dob: "",
            programId: "",
            classId: "",
            sectionId: "",
            tuitionFee: "",
            numberOfInstallments: "1",
            lateFeeFine: 0,
            installments: initialData.feeInstallments || [],
            ...initialData
        });
        setImagePreview(initialData.photo_url || "");
        setImageFile(null);
    }, [initialData]);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(initialData.photo_url || "");

    // === CALCULATED FIELDS ===

    const selectedProgram = useMemo(() =>
        programs.find(p => p.id.toString() === formData.programId.toString()),
        [programs, formData.programId]
    );

    const selectedClass = useMemo(() => {
        if (!selectedProgram) return null;
        // Search in program.classes to get feeStructures
        return selectedProgram.classes?.find(c => c.id.toString() === formData.classId.toString());
    }, [selectedProgram, formData.classId]);

    const hasSections = useMemo(() =>
        selectedClass?.sections && selectedClass.sections.length > 0,
        [selectedClass]
    );

    const availableSections = useMemo(() =>
        sections.filter(sec => sec.classId.toString() === formData.classId.toString()),
        [sections, formData.classId]
    );

    // === ROLL NUMBER LOGIC ===

    const calculatedPrefix = useMemo(() => {
        if (!formData.classId || !programs.length) return "";
        const prog = programs.find(p => p.id.toString() === formData.programId.toString());
        const cls = classes.find(c => c.id.toString() === formData.classId.toString());
        const pPrefix = prog?.rollPrefix || "";
        const cPrefix = cls?.rollPrefix || "";

        // Check for overlap
        if (pPrefix && cPrefix && cPrefix.startsWith(pPrefix)) {
            return cPrefix;
        }
        return `${pPrefix}${cPrefix}`;
    }, [formData.classId, formData.programId, programs, classes]);

    const rollNumberSuffix = useMemo(() => {
        if (calculatedPrefix && formData.rollNumber.startsWith(calculatedPrefix)) {
            return formData.rollNumber.slice(calculatedPrefix.length);
        }
        return formData.rollNumber;
    }, [formData.rollNumber, calculatedPrefix]);

    const prevPrefixRef = useRef("");

    useEffect(() => {
        const prevPrefix = prevPrefixRef.current;
        if (calculatedPrefix && calculatedPrefix !== prevPrefix) {
            if (isEditing) {
                const currentRoll = formData.rollNumber || "";
                if (prevPrefix && currentRoll.startsWith(prevPrefix)) {
                    const numericPart = currentRoll.slice(prevPrefix.length);
                    setFormData(prev => ({ ...prev, rollNumber: `${calculatedPrefix}${numericPart}` }));
                } else if (!currentRoll || currentRoll === prevPrefix) {
                    setFormData(prev => ({ ...prev, rollNumber: calculatedPrefix }));
                }
            } else {
                // Auto-generate for NEW students
                const generate = async () => {
                    if (!getLatestRollNumber) return;
                    try {
                        const currentYearSub = new Date().getFullYear().toString().slice(-2);
                        const searchPrefix = `${calculatedPrefix}${currentYearSub}-`;
                        const latestFull = await getLatestRollNumber(searchPrefix);

                        let nextSuffix = `${currentYearSub}-001`;
                        if (latestFull) {
                            const parts = latestFull.split("-");
                            const lastPart = parts[parts.length - 1];
                            if (!isNaN(parseInt(lastPart))) {
                                const nextNum = parseInt(lastPart, 10) + 1;
                                const nextNumStr = nextNum.toString().padStart(3, '0');
                                nextSuffix = `${currentYearSub}-${nextNumStr}`;
                            }
                        }
                        setFormData(prev => ({ ...prev, rollNumber: `${calculatedPrefix}${nextSuffix}` }));
                    } catch (error) {
                        setFormData(prev => ({ ...prev, rollNumber: calculatedPrefix }));
                    }
                };
                generate();
            }
            prevPrefixRef.current = calculatedPrefix;
        }
    }, [calculatedPrefix, isEditing, getLatestRollNumber, formData.rollNumber]);

    // === HANDLERS ===

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleAddInstallment = () => {
        const nextNum = formData.installments.length + 1;
        const totalAmount = Number(formData.tuitionFee) || 0;
        const installmentAmount = Math.floor(totalAmount / (formData.installments.length + 1));

        setFormData(prev => ({
            ...prev,
            installments: [
                ...prev.installments,
                { installmentNumber: nextNum, amount: installmentAmount, dueDate: "" }
            ]
        }));
    };

    const handleRemoveInstallment = (index) => {
        setFormData(prev => ({
            ...prev,
            installments: prev.installments.filter((_, i) => i !== index)
        }));
    };

    const handleInstallmentChange = (index, field, value) => {
        const newInstallments = [...formData.installments];
        newInstallments[index] = { ...newInstallments[index], [field]: value };
        setFormData({ ...formData, installments: newInstallments });
    };

    const toggleDocument = (key) => {
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [key]: !prev.documents?.[key]
            }
        }));
    };

    const internalSubmit = () => {
        // Validation
        if (!formData.fName || !formData.rollNumber || !formData.programId || !formData.classId) {
            toast({ title: "Please fill all required fields", variant: "destructive" });
            return;
        }

        const standardFee = selectedClass?.feeStructures?.[0]?.totalAmount || 0;
        if (standardFee > 0 && Number(formData.tuitionFee) > standardFee) {
            toast({
                title: "Invalid Tuition Fee",
                description: `Agreed fee (Rs. ${formData.tuitionFee}) cannot exceed standard fee (Rs. ${standardFee}).`,
                variant: "destructive"
            });
            return;
        }

        // Installments validation
        if (!formData.installments || formData.installments.length === 0) {
            toast({
                title: "Validation Error",
                description: "Please define at least one installment in the fee plan.",
                variant: "destructive"
            });
            return;
        }

        const totalInstallmentsAmount = formData.installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
        const agreedTuitionFee = Number(formData.tuitionFee) || 0;

        if (totalInstallmentsAmount !== agreedTuitionFee) {
            toast({
                title: "Installment Mismatch",
                description: `Total of installments (Rs. ${totalInstallmentsAmount}) must equal the agreed tuition fee (Rs. ${agreedTuitionFee}).`,
                variant: "destructive"
            });
            return;
        }

        const allowedFields = [
            'fName', 'mName', 'lName', 'fatherOrguardian', 'rollNumber',
            'parentOrGuardianEmail', 'parentOrGuardianPhone', 'address',
            'gender', 'dob', 'programId', 'classId', 'sectionId',
            'tuitionFee', 'numberOfInstallments', 'lateFeeFine',
            'installments', 'documents', 'status'
        ];

        const submissionData = new FormData();
        allowedFields.forEach(key => {
            if (key === 'installments' || key === 'documents') {
                submissionData.append(key, JSON.stringify(formData[key] || (key === 'documents' ? {} : [])));
            } else if (formData[key] !== undefined && formData[key] !== null) {
                submissionData.append(key, formData[key]);
            }
        });

        if (imageFile) {
            submissionData.append('photo', imageFile);
        }

        onSubmit(submissionData);
    };

    return (
        <div className="space-y-6">
            {headerExtra}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* LEFT — PHOTO */}
                <div className="md:col-span-1 space-y-2">
                    <Label>Photo *</Label>
                    <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative group"
                        onClick={() => document.getElementById('photo-input').click()}
                    >
                        {imagePreview ? (
                            <div className="relative inline-block w-32 h-32">
                                <img
                                    src={imagePreview}
                                    alt="preview"
                                    className="w-full h-full rounded-full object-cover border-2 border-primary/20"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Upload className="text-white w-8 h-8" />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImagePreview("");
                                        setImageFile(null);
                                    }}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="py-4">
                                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-xs text-muted-foreground">
                                    Click or drag to upload photo
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-bold">
                                    Max 5MB
                                </p>
                            </div>
                        )}
                        <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                {/* RIGHT — FORM */}
                <div className="md:col-span-3">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Names */}
                        <div>
                            <Label>First Name *</Label>
                            <Input
                                value={formData.fName}
                                onChange={(e) => setFormData({ ...formData, fName: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <Label>Middle Name</Label>
                            <Input
                                value={formData.mName}
                                onChange={(e) => setFormData({ ...formData, mName: e.target.value })}
                                placeholder="Michael"
                            />
                        </div>
                        <div>
                            <Label>Last Name</Label>
                            <Input
                                value={formData.lName}
                                onChange={(e) => setFormData({ ...formData, lName: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>

                        {/* Guardian + Roll */}
                        <div>
                            <Label>Father/Guardian</Label>
                            <Input
                                value={formData.fatherOrguardian}
                                onChange={(e) => setFormData({ ...formData, fatherOrguardian: e.target.value })}
                                placeholder="Father's name"
                            />
                        </div>
                        <div>
                            <Label>Roll Number *</Label>
                            <div className="flex items-center">
                                {calculatedPrefix && (
                                    <div className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-xs font-mono text-muted-foreground h-10 flex items-center whitespace-nowrap">
                                        {calculatedPrefix}
                                    </div>
                                )}
                                <Input
                                    className={calculatedPrefix ? "rounded-l-none" : ""}
                                    value={rollNumberSuffix}
                                    onChange={(e) => setFormData({ ...formData, rollNumber: `${calculatedPrefix}${e.target.value}` })}
                                    placeholder="e.g. 26-001"
                                />
                            </div>
                        </div>

                        {/* Program, Class, Section */}
                        <div>
                            <Label>Program *</Label>
                            <Select
                                value={formData.programId.toString()}
                                onValueChange={(v) => setFormData({ ...formData, programId: v, classId: "", sectionId: "" })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                                <SelectContent>
                                    {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Class *</Label>
                            <Select
                                value={formData.classId.toString()}
                                onValueChange={(v) => {
                                    const prog = programs.find(p => p.id.toString() === formData.programId.toString());
                                    // Find class within program.classes because it contains feeStructures
                                    const clsWithFee = prog?.classes?.find(c => c.id.toString() === v);
                                    const fee = clsWithFee?.feeStructures?.[0];

                                    setFormData(prev => ({
                                        ...prev,
                                        classId: v,
                                        sectionId: "",
                                        tuitionFee: !isEditing ? (fee?.totalAmount?.toString() || "") : prev.tuitionFee,
                                        numberOfInstallments: !isEditing ? (fee?.installments?.toString() || "1") : prev.numberOfInstallments
                                    }));
                                }}
                                disabled={!formData.programId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedProgram?.classes?.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Section {hasSections ? "*" : ""}</Label>
                            <Select
                                value={formData.sectionId.toString()}
                                onValueChange={(v) => setFormData({ ...formData, sectionId: v })}
                                disabled={!formData.classId || !hasSections}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                <SelectContent>
                                    {availableSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Parent Info & Demo */}
                        <div>
                            <Label>Parent Email</Label>
                            <Input type="email" value={formData.parentOrGuardianEmail} onChange={e => setFormData({ ...formData, parentOrGuardianEmail: e.target.value })} />
                        </div>
                        <div>
                            <Label>Parent Phone</Label>
                            <Input value={formData.parentOrGuardianPhone} onChange={e => setFormData({ ...formData, parentOrGuardianPhone: e.target.value })} />
                        </div>
                        <div>
                            <Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date of Birth</Label>
                            <Input type="date" value={formData.dob ? formData.dob.split('T')[0] : ""} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <Label>Address</Label>
                            <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" />
                        </div>
                    </div>
                </div>
            </div>

            {/* FEE INSTALLMENT PLAN SECTION */}
            <div className="mt-8 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Fee Installment Plan</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddInstallment} className="gap-1">
                        <Plus className="w-4 h-4" /> Add Installment
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tuition Fee (Agreed)</Label>
                            {selectedClass?.feeStructures?.[0] && (
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                    Std: Rs. {selectedClass.feeStructures[0].totalAmount}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                className="pl-8 font-bold text-primary"
                                value={formData.tuitionFee}
                                onChange={e => setFormData({ ...formData, tuitionFee: e.target.value })}
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">Rs.</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Late Fee Fine (Per Day)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                className="pl-8"
                                value={formData.lateFeeFine}
                                onChange={e => setFormData({ ...formData, lateFeeFine: Number(e.target.value) })}
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">Rs.</span>
                        </div>
                    </div>
                </div>

                {formData.installments.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left">Inst. #</th>
                                    <th className="px-4 py-2 text-left">Amount (Rs.)</th>
                                    <th className="px-4 py-2 text-left">Due Date</th>
                                    <th className="px-4 py-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {formData.installments.map((inst, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                className="w-20"
                                                value={inst.installmentNumber}
                                                onChange={e => handleInstallmentChange(index, "installmentNumber", Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                value={inst.amount}
                                                onChange={e => handleInstallmentChange(index, "amount", Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                type="date"
                                                value={inst.dueDate ? inst.dueDate.split('T')[0] : ""}
                                                onChange={e => handleInstallmentChange(index, "dueDate", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveInstallment(index)} className="text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-muted/20 rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground text-sm italic">No installments defined yet. Default single payment will apply.</p>
                    </div>
                )}
            </div>

            {/* DOCUMENTS */}
            <div className="mt-8 pt-6 border-t">
                <Label className="text-lg font-semibold text-primary mb-4 block">Required Documents</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {[
                        { key: "formB", label: "Form B / Domicile" },
                        { key: "pictures", label: "4 Passport Size Pictures" },
                        { key: "dmcMatric", label: "DMC Matric" },
                        { key: "dmcIntermediate", label: "DMC Intermediate" },
                        { key: "fatherCnic", label: "Father CNIC" },
                        { key: "migration", label: "Migration (if from other board)" },
                        { key: "affidavit", label: "Affidavit" },
                        { key: "admissionForm", label: "Admission Form" },
                    ].map((doc) => (
                        <div
                            key={doc.key}
                            onClick={() => toggleDocument(doc.key)}
                            className={`cursor-pointer rounded-lg border p-3 text-sm font-medium flex items-center justify-center transition-all ${formData.documents?.[doc.key]
                                ? "bg-primary text-white border-primary shadow-md scale-[1.02]"
                                : "border-gray-300 hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            {doc.label}
                            {formData.documents?.[doc.key] && <Check className="w-4 h-4 ml-2" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={internalSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditing ? "Update" : "Create"} Student
                </Button>
            </div>
        </div>
    );
};

export default StudentForm;
