/**
 * Pure validation function for the Staff form wizard.
 * Returns an object of { fieldName: "error message" } for each invalid required field.
 *
 * @param {string} tab - "basic" | "employment" | "roles" | "details"
 * @param {object} formData - current form state
 * @param {boolean} isEditing - true when editing an existing staff member
 * @returns {object} errors map
 */
import {
  INPUT_LIMITS,
  firstError,
  validateCnic,
  validateEmail,
  validateMaxLength,
  validateNonNegativeNumber,
  validatePkPhone,
} from "@/lib/inputValidation";

export function validateCurrentTab(tab, formData, isEditing) {
  const errors = {};

  if (tab === "basic") {
    if (!formData.name || !String(formData.name).trim()) {
      errors.name = "Name is required";
    }
    if (!formData.email || !String(formData.email).trim()) {
      errors.email = "Email is required";
    } else {
      errors.email = firstError(
        validateEmail(formData.email),
        validateMaxLength(formData.email, INPUT_LIMITS.email, "Email"),
      );
    }
    if (!formData.designation || !String(formData.designation).trim()) {
      errors.designation = "Designation is required";
    }
    if (!isEditing && (!formData.password || !String(formData.password).trim())) {
      errors.password = "Password is required";
    } else {
      errors.password = validateMaxLength(formData.password, INPUT_LIMITS.password, "Password");
    }
    errors.name = errors.name || validateMaxLength(formData.name, INPUT_LIMITS.name, "Name");
    errors.fatherName = validateMaxLength(formData.fatherName, INPUT_LIMITS.name, "Father's name");
    errors.cnic = validateCnic(formData.cnic);
    errors.phone = validatePkPhone(formData.phone);
    errors.address = validateMaxLength(formData.address, INPUT_LIMITS.longText, "Address");
    errors.designation = errors.designation || validateMaxLength(formData.designation, INPUT_LIMITS.name, "Designation");
  }

  if (tab === "employment") {
    if (!formData.staffType || !String(formData.staffType).trim()) {
      errors.staffType = "Staff type is required";
    }
    if (!formData.status || !String(formData.status).trim()) {
      errors.status = "Status is required";
    }
    if (!formData.basicPay || !String(formData.basicPay).trim()) {
      errors.basicPay = "Basic pay is required";
    } else {
      errors.basicPay = validateNonNegativeNumber(formData.basicPay, "Basic pay");
    }
    if (!formData.joinDate || !String(formData.joinDate).trim()) {
      errors.joinDate = "Join date is required";
    }
    if (formData.staffType === "CONTRACT") {
      if (!formData.contractStart || !String(formData.contractStart).trim()) {
        errors.contractStart = "Contract start date is required";
      }
      if (!formData.contractEnd || !String(formData.contractEnd).trim()) {
        errors.contractEnd = "Contract end date is required";
      }
    }
    if (formData.status === "TERMINATED" || formData.status === "RETIRED") {
      if (!formData.leaveDate || !String(formData.leaveDate).trim()) {
        errors.leaveDate = "Leave date is required";
      }
    }
  }

  if (tab === "roles") {
    if (!formData.isTeaching && !formData.isNonTeaching) {
      errors.roles = "At least one role must be selected";
    }
  }

  Object.keys(errors).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });
  return errors;
}
