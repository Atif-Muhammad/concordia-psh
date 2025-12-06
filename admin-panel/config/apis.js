import axios from "axios";
import { formatLocalDate } from "../src/lib/utils";

const base_url = "http://localhost:3003";

export const userWho = async () => {
  try {
    const response = await axios.get(`${base_url}/auth/user-who`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const refreshTokens = async () => {
  try {
    const response = await axios.post(`${base_url}/auth/refresh-tokens`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(
      `${base_url}/auth/logout`,
      {},
      { withCredentials: true }
    );
    return response;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const loginAdmin = async (data) => {
  try {
    const response = await axios.post(`${base_url}/auth/login`, data, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// admin
export const getAdmins = async () => {
  try {
    const response = await axios.get(`${base_url}/admin/get/admins`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createAdmin = async (data) => {
  try {
    const response = await axios.post(`${base_url}/admin/create/admin`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateAdmin = async (adminID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/admin/update/admin?adminID=${adminID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteAdmin = async (adminID) => {
  try {
    const response = await axios.delete(
      `${base_url}/admin/remove/admin?adminID=${adminID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getEmployeesByDept = async () => {
  try {
    const response = await axios.get(`${base_url}/hr/get/employees-by-dept`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
    
};

export const getPayrollSettings = async () => {
  try {
    const response = await axios.get(`${base_url}/hr/payroll-settings`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const updatePayrollSettings = async (data) => {
  try {
    const response = await axios.patch(`${base_url}/hr/payroll-settings`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// department
export const getDepartmentNames = async () => {
  try {
    const response = await axios.get(`${base_url}/department/get/names`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      teacherssponse?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getDepartments = async () => {
  try {
    const response = await axios.get(`${base_url}/department/get`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      teacherssponse?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createDepartment = async (data) => {
  try {
    const response = await axios.post(`${base_url}/department/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateDepartment = async ({ depID, data }) => {
  try {
    const response = await axios.patch(
      `${base_url}/department/update?depID=${depID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteDepartment = async (depID) => {
  try {
    const response = await axios.delete(
      `${base_url}/department/remove?depID=${depID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// teacher
export const getTeacherNames = async () => {
  try {
    const response = await axios.get(`${base_url}/teacher/get/names`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getTeacherSubjects = async () => {
  try {
    const response = await axios.get(`${base_url}/teacher/subjects`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getTeachers = async () => {
  try {
    const response = await axios.get(`${base_url}/teacher/get`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createTeacher = async (data) => {
  try {
    const response = await axios.post(`${base_url}/teacher/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateTeacher = async (teacherID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/teacher/update?teacherID=${teacherID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteTeacher = async (teacherID) => {
  try {
    const response = await axios.delete(
      `${base_url}/teacher/remove?teacherID=${teacherID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// mark teacher attendance
export const markTeacherAttendance  = async (id, status, date) => {
  try {
    const response = await axios.patch(
      `${base_url}/admin/mark/teacher?id=${id}`,
      {status, date},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// student attendance
// Get teacher's assigned classes (requires authentication)
export const getTeacherClasses = async () => {
  try {
    const { data } = await axios.get(`${base_url}/teacher/get/classes`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const fetchStudentAttendance = async (classId, sectionId, subjectId, date) => {
  try {
    const response = await axios.get(
      `${base_url}/attendance/student/fetch?classId=${classId}&sectionId=${sectionId || ''}&subjectId=${subjectId}&date=${date}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const updateStudentAttendance = async (data) => {
  try {
    const response = await axios.patch(
      `${base_url}/attendance/student/update`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// programs
export const getProgramNames = async () => {
  try {
    const response = await axios.get(
      `${base_url}/academics/program/get/all/names`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getPrograms = async () => {
  try {
    const response = await axios.get(`${base_url}/academics/program/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createProgram = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/program/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateProgram = async (programID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/program/update?programID=${programID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteProgram = async (programID) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/program/remove?programID=${programID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// classes
export const getClasseNames = async () => {
  try {
    const response = await axios.get(
      `${base_url}/academics/class/get/all/names`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getClasses = async () => {
  try {
    const {data} = await axios.get(`${base_url}/academics/class/get/all`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const createClass = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/class/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateClass = async (classID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/class/update?classID=${classID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteClass = async (classID) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/class/remove?classID=${classID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// sections
export const getSectionNames = async () => {
  try {
    const response = await axios.get(
      `${base_url}/academics/section/get/all/names`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getSections = async () => {
  try {
    const response = await axios.get(`${base_url}/academics/section/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createSection = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/section/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateSection = async (secID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/section/update?secID=${secID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteSection = async (secID) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/section/remove?secID=${secID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// subjects
export const getSubjects = async () => {
  try {
    const response = await axios.get(`${base_url}/academics/subject/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const getClassSubjects = async (classId) => {
  try {
    const response = await axios.get(`${base_url}/academics/subject/get/all?classId=${classId}`, {
      withCredentials: true,
    });
    // Filter locally if backend doesn't support filtering by classId in get/all, 
    // but assuming we might need to filter.
    // Actually, let's check if get/all supports query params. 
    // If not, we filter client side or assume getSubjects returns all.
    // For now, let's assume we filter client side if the API returns all, or we use a new endpoint if available.
    // But wait, the backend `subject.controller.ts` isn't visible.
    // Let's just use getSubjects and filter in frontend for now to be safe, or add a specific call if needed.
    // Actually, I'll add a specific function that filters the result of getSubjects if needed, 
    // but better to just use getSubjects in the component and filter there.
    // However, for cleaner code, let's add it here.
    return response.data.filter(s => s.classId == classId);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// Get subjects assigned to the logged-in teacher for a specific class
export const getTeacherSubjectsForClass = async (classId) => {
  try {
    const response = await axios.get(
      `${base_url}/teacher/subjects/by-class?classId=${classId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const createSubject = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/subject/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateSubject = async (subID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/subject/update?subID=${subID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteSubject = async (subID) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/subject/remove?subID=${subID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// teacherSubjectMappings
export const getTeacherSubjectMappings = async () => {
  try {
    const response = await axios.get(`${base_url}/academics/tsm/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createTeacherSubjectMapping = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/tsm/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateTeacherSubjectMapping = async (tsmID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/tsm/update?tsmID=${tsmID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteTeacherSubjectMapping = async (tsmID) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/tsm/remove?tsmID=${tsmID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// teacherClassMappings
export const getTeacherClassMappings = async () => {
  try {
    const response = await axios.get(`${base_url}/academics/tcm/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createTeacherClassMappings = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/tcm/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateTeacherClassMappings = async (tcmID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/tcm/update?tcmID=${tcmID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteTeacherClassMappings = async (tcmID) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/tcm/remove?tcmID=${tcmID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// timetables
export const getTimetables = async () => {
  try {
    const response = await axios.get(
      `${base_url}/academics/timetable/get/all`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createTimetable = async (data) => {
  try {
    const response = await axios.post(
      `${base_url}/academics/timetable/create`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateTimetable = async (timetableId, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/academics/timetable/update?timetableId=${timetableId}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteTimetable = async (timetableId) => {
  try {
    const response = await axios.delete(
      `${base_url}/academics/timetable/remove?timetableId=${timetableId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// assignments
export const getAssignments = async () => {
  try {
    const response = await axios.get(`${base_url}/assignment/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createAssignment = async (data) => {
  try {
    const response = await axios.post(`${base_url}/assignment/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateAssignment = async (assID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/assignment/update?assID=${assID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteAssignment = async (assID) => {
  try {
    const response = await axios.delete(
      `${base_url}/assignment/remove?assID=${assID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

///////////////////////////////////////////////////////////////////////////
// students //
export const getPassedOutStudents = async () => {
  try {
    const response = await axios.get(`${base_url}/student/get/all/passout`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const getStudents = async () => {
  try {
    const response = await axios.get(`${base_url}/student/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const createStudent = async (data) => {
  try {
    const response = await axios.post(`${base_url}/student/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const updateStudent = async (studentID, data) => {
  try {
    const response = await axios.patch(
      `${base_url}/student/update?studentID=${studentID}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
export const deleteStudent = async (studentID) => {
  try {
    const response = await axios.delete(
      `${base_url}/student/remove?studentID=${studentID}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// promote
export const promoteStudents = async (studentID) => {
  try {
    const response = await axios.patch(
      `${base_url}/student/promote?studentID=${studentID}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
// demote
export const demoteStudents = async (studentID) => {
  try {
    const response = await axios.patch(
      `${base_url}/student/demote?studentID=${studentID}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
// passout
export const passoutStudents = async (studentID) => {
  try {
    const response = await axios.patch(
      `${base_url}/student/passout?studentID=${studentID}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// Search students by name or roll number
export const searchStudents = async (query) => {
  try {
    const { data } = await axios.get(`${base_url}/student/search?searchFor=${encodeURIComponent(query)}`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// will return attendance, if not available then return students of the class/section
export const getClasseOrSectionAttendance = async (id, date, fetchFor, subjectId) => {
  try {
    const response = await axios.get(
      `${base_url}/teacher/get/class/students/attendance?id=${id}&date=${date}&fetchFor=${fetchFor}&subjectId=${subjectId}`,
      { withCredentials: true }
    );
    // console.log(response.data)
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const updateAttendance = async (classId, sectionId, subjectId, date, payload) => {
  try {
    const params = new URLSearchParams({ classId, date });

    if (sectionId) params.append("sectionId", sectionId);
    if (subjectId) params.append("subjectId", subjectId);

    const { data } = await axios.patch(
      `${base_url}/teacher/update/class/students/attendance?${params.toString()}`,
      payload,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};


export const getWeeklyMonthlyReport = async (reportType, reportClass) => {
  try {
    const today = new Date();
    const startDate = new Date(today);

    // Calculate start date based on report type
    if (reportType === "weekly") {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setMonth(today.getMonth() - 1);
    }

    const start = startDate.toISOString().split("T")[0];
    const end = today.toISOString().split("T")[0];

    // Build URL dynamically
    const url = `${base_url}/attendance/report?start=${start}&end=${end}${
      reportClass && reportClass !== "all" ? `&classId=${reportClass}` : ""
    }`;

    const { data } = await axios.get(url, { withCredentials: true });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// teacher attendance
export const getTeacherAttendance = async (date) => {
  try {
    const response = await axios.get(`${base_url}/admin/get/teacher/attendance?date=${date}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// leaves
export const getLeaves = async ({ pageParam = 1 }) => {
  try {
    const { data } = await axios.get(`${base_url}/attendance/leaves/get`, {
      params: { page: pageParam, limit: 100 },
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createLeave = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/attendance/leaves/create`,
      payload,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateLeave = async (id, status) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/attendance/leaves/update?id=${id}`,
      { status },
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteLeave = async (id) => {
  try {
    const { data } = await axios.delete(`${base_url}/attendance/leave/${id}`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// search student
export const searchStudent = async (searchQuery) => {
  try {
    const { data } = await axios.get(
      `${base_url}/student/search?searchFor=${searchQuery}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};


//////////////////////////////
// hr
// employees
export const createEmp = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/hr/create/employee`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateEmp = async (id, payload) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/hr/update/employee?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delEmp = async (empId) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/hr/delete/employees?empId=${empId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Attendance Report
export const getAttendanceReport = async (start, end, classId, sectionId) => {
  try {
    const params = new URLSearchParams({ start, end });
    if (classId) params.append('classId', classId);
    if (sectionId) params.append('sectionId', sectionId);
    
    const response = await axios.get(
      `${base_url}/attendance/report?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const getEmp = async (dept) => {
  try {
    const url = dept ? `${base_url}/hr/get/employees?dept=${dept}` : `${base_url}/hr/get/employees`;
    const { data } = await axios.get(
      url,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};



//////////////////////////////////////////////////////
// front office
export const createInquiry = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/front-office/create/inquiry`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateInquiry = async (id, payload) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/front-office/update/inquiry?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delInquiry = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/front-office/delete/inquiry?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getInquiries = async (programId) => {
  try {
    const { data } = await axios.get(
      `${base_url}/front-office/get/inquiries?programId=${programId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// visitors
export const createVisitor = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/front-office/create/visitor`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateVisitor = async (id, payload) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/front-office/update/visitor?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// fee management
// fee heads
export const createFeeHead = async (data) => {
  try {
    const response = await axios.post(`${base_url}/fee-management/head/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getFeeHeads = async () => {
  try {
    const response = await axios.get(`${base_url}/fee-management/head/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateFeeHead = async (id, data) => {
  try {
    const response = await axios.patch(`${base_url}/fee-management/head/update?id=${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteFeeHead = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/fee-management/head/delete?id=${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// fee structures
export const createFeeStructure = async (data) => {
  try {
    const response = await axios.post(`${base_url}/fee-management/structure/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getFeeStructures = async () => {
  try {
    const response = await axios.get(`${base_url}/fee-management/structure/get/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateFeeStructure = async (id, data) => {
  try {
    const response = await axios.patch(`${base_url}/fee-management/structure/update?id=${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteFeeStructure = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/fee-management/structure/delete?id=${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// fee challans
export const createFeeChallan = async (data) => {
  try {
    const response = await axios.post(`${base_url}/fee-management/challan/create`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getFeeChallans = async (studentId, search) => {
  try {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (search) params.append('search', search);
    
    const url = `${base_url}/fee-management/challan/get/all${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateFeeChallan = async (id, data) => {
  try {
    const response = await axios.patch(`${base_url}/fee-management/challan/update?id=${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteFeeChallan = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/fee-management/challan/delete?id=${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getStudentFeeHistory = async (studentId) => {
  try {
    const response = await axios.get(`${base_url}/fee-management/challan/history?studentId=${studentId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getStudentFeeSummary = async (studentId) => {
  try {
    const response = await axios.get(`${base_url}/fee-management/student/summary?studentId=${studentId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delVisitor = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/front-office/delete/visitor?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getVisitors = async () => {
  try {
    const { data } = await axios.get(
      `${base_url}/front-office/get/visitors`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};


// complaints
export const createComplaint = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/front-office/create/complaint`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateComplaint = async (id, payload) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/front-office/update/complaint?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delComplaint = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/front-office/delete/complaint?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getComplaints = async (date) => {
  try {
    const localDate = formatLocalDate(date)
    const { data } = await axios.get(
      `${base_url}/front-office/get/complaints?date=${localDate.split("T")[0]}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};


// complaints
export const createContact = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/front-office/create/contact`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateContact = async (id, payload) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/front-office/update/contact?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delContact = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/front-office/delete/contact?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getContacts = async () => {
  try {
    const { data } = await axios.get(
      `${base_url}/front-office/get/contacts`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};



// exams
export const createExam = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/exams/create`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateExam = async (id, payload) => {
  try {
    const { data } = await axios.put(
      `${base_url}/exams/update?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delExam = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/exams/delete?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getExams = async () => {
  try {
    const { data } = await axios.get(
      `${base_url}/exams/all`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};


// marks
export const createMarks = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/exams/marks/create`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateMarks = async (id, payload) => {
  try {
    const { data } = await axios.put(
      `${base_url}/exams/marks/update?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delMarks = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/exams/marks/delete?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getMarks = async (examId, sectionId) => {
  try {
    const params = new URLSearchParams();
    if (examId) params.append('examId', examId);
    if (sectionId) params.append('sectionId', sectionId);
    
    const url = params.toString() 
      ? `${base_url}/exams/marks/all?${params.toString()}`
      : `${base_url}/exams/marks/all`;
    
    const { data } = await axios.get(
      url,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// results
export const createResult = async (payload) => {
  try {
    const { data } = await axios.post(
      `${base_url}/exams/result/create`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const updateResult = async (id, payload) => {
  try {
    const { data } = await axios.put(
      `${base_url}/exams/result/update?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const delResult = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/exams/result/delete?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
export const getResults = async () => {
  try {
    const { data } = await axios.get(
      `${base_url}/exams/result/all`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getStudentResult = async (studentId, examId) => {
  try {
    const { data } = await axios.get(
      `${base_url}/exams/result/student?studentId=${studentId}&examId=${examId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const generateResults = async (examId, classId) => {
  try {
    const params = new URLSearchParams();
    params.append('examId', examId);
    if (classId) params.append('classId', classId);
    
    const { data } = await axios.post(
      `${base_url}/exams/result/generate?${params.toString()}`,
      {},
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Positions APIs
export const getPositions = async (examId, classId) => {
  try {
    const params = new URLSearchParams();
    if (examId) params.append('examId', examId);
    if (classId) params.append('classId', classId);
    
    const url = params.toString() 
      ? `${base_url}/exams/positions/all?${params.toString()}`
      : `${base_url}/exams/positions/all`;
      
    const { data } = await axios.get(url, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const generatePositions = async (examId, classId) => {
  try {
    const params = new URLSearchParams();
    params.append('examId', examId);
    if (classId) params.append('classId', classId);
    
    const { data } = await axios.post(
      `${base_url}/exams/positions/generate?${params.toString()}`,
      {},
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updatePosition = async (id, payload) => {
  try {
    const { data } = await axios.put(
      `${base_url}/exams/positions/update?id=${id}`,
      payload,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const delPosition = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/exams/positions/delete?id=${id}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ==========================================
// STUDENT ATTENDANCE & RESULTS APIs
// ==========================================

// Get attendance records for a specific student
export const getStudentAttendance = async (studentId) => {
  try {
    const { data } = await axios.get(
      `${base_url}/student/attendance/${studentId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Get exam results for a specific student
export const getStudentResults = async (studentId) => {
  try {
    const { data } = await axios.get(
      `${base_url}/student/results/${studentId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Generate attendance report for a specific student
export const generateAttendanceReport = async (studentId) => {
  try {
    const { data } = await axios.get(
      `${base_url}/student/attendance-report/${studentId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Generate result report for a specific student
export const generateResultReport = async (studentId) => {
  try {
    const { data } = await axios.get(
      `${base_url}/student/result-report/${studentId}`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getDefaultReportCardTemplate = async () => {
  try {
    const { data } = await axios.get(
      `${base_url}/configuration/report-card-templates/default`,
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOSTEL - REGISTRATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getHostelRegistrations = async () => {
  try {
    const { data } = await axios.get(`${base_url}/hostel/registrations`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createHostelRegistration = async (registrationData) => {
  try {
    const { data } = await axios.post(
      `${base_url}/hostel/registrations`,
      registrationData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateHostelRegistration = async (id, registrationData) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/hostel/registrations/${id}`,
      registrationData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteHostelRegistration = async (id) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/hostel/registrations/${id}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOSTEL - ROOMS & ALLOCATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getRooms = async () => {
  try {
    const { data } = await axios.get(`${base_url}/hostel/rooms`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createRoom = async (roomData) => {
  try {
    const { data } = await axios.post(`${base_url}/hostel/rooms`, roomData, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateRoom = async (id, roomData) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/hostel/rooms/${id}`,
      roomData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteRoom = async (id) => {
  try {
    const { data } = await axios.delete(`${base_url}/hostel/rooms/${id}`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const allocateRoom = async (allocationData) => {
  try {
    const { data } = await axios.post(
      `${base_url}/hostel/allocations`,
      allocationData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deallocateStudent = async (allocationId) => {
  try {
    const { data } = await axios.delete(
      `${base_url}/hostel/allocations/${allocationId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOSTEL - EXPENSES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getHostelExpenses = async () => {
  try {
    const { data } = await axios.get(`${base_url}/hostel/expenses`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createHostelExpense = async (expenseData) => {
  try {
    const { data } = await axios.post(
      `${base_url}/hostel/expenses`,
      expenseData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateHostelExpense = async (id, expenseData) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/hostel/expenses/${id}`,
      expenseData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteHostelExpense = async (id) => {
  try {
    const { data } = await axios.delete(`${base_url}/hostel/expenses/${id}`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOSTEL - INVENTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getInventoryItems = async () => {
  try {
    const { data } = await axios.get(`${base_url}/hostel/inventory`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createInventoryItem = async (itemData) => {
  try {
    const { data } = await axios.post(
      `${base_url}/hostel/inventory`,
      itemData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateInventoryItem = async (id, itemData) => {
  try {
    const { data } = await axios.patch(
      `${base_url}/hostel/inventory/${id}`,
      itemData,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteInventoryItem = async (id) => {
  try {
    const { data } = await axios.delete(`${base_url}/hostel/inventory/${id}`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// School Inventory
export const getSchoolInventoryItems = async (params) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${base_url}/inventory/items${queryParams ? `?${queryParams}` : ''}`;
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const getSchoolInventoryItem = async (id) => {
  try {
    const response = await axios.get(`${base_url}/inventory/items/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const createSchoolInventoryItem = async (data) => {
  try {
    const response = await axios.post(`${base_url}/inventory/items`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const updateSchoolInventoryItem = async ({ id, data }) => {
  try {
    const response = await axios.patch(
      `${base_url}/inventory/items/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteSchoolInventoryItem = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/inventory/items/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

// Inventory Expenses
export const getInventoryExpenses = async () => {
  try {
    const response = await axios.get(`${base_url}/inventory/expenses`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const getInventoryExpensesByItem = async (itemId) => {
  try {
    const response = await axios.get(`${base_url}/inventory/expenses/item/${itemId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const createInventoryExpense = async (data) => {
  try {
    const response = await axios.post(`${base_url}/inventory/expenses`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const updateInventoryExpense = async ({ id, data }) => {
  try {
    const response = await axios.patch(
      `${base_url}/inventory/expenses/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteInventoryExpense = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/inventory/expenses/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    throw { message, status: error.response?.status || 500 };
  }
};
// Fee Reports
export const getRevenueOverTime = async ({ period }) => {
  try {
    const response = await axios.get(`${base_url}/fee-management/reports/revenue-over-time?period=${period}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    throw { message, status: error.response?.status || 500 };
  }
};

export const getClassCollectionStats = async () => {
  try {
    const response = await axios.get(`${base_url}/fee-management/reports/class-collection`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    throw { message, status: error.response?.status || 500 };
  }
};


// Leave Management
export const getLeaveSheet = async (month, type) => {
  try {
    const response = await axios.get(`${base_url}/hr/leave-sheet`, {
      params: { month, type },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    throw { message, status: error.response?.status || 500 };
  }
};

export const upsertLeave = async (data) => {
  try {
    const response = await axios.post(`${base_url}/hr/leave`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    throw { message, status: error.response?.status || 500 };
  }
};

// Employee Attendance
export const getEmployeeAttendance = async (date) => {
  try {
    const response = await axios.get(`${base_url}/hr/employee-attendance`, {
      params: { date },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    throw { message, status: error.response?.status || 500 };
  }
};

export const markEmployeeAttendance = async (data) => {
  try {
    const response = await axios.post(`${base_url}/hr/employee-attendance`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    throw { message, status: error.response?.status || 500 };
  }
};

export const createHoliday = async (data) => {
  try {
    const response = await axios.post(`${base_url}/hr/holidays`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getHolidays = async () => {
  try {
    const response = await axios.get(`${base_url}/hr/holidays`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteHoliday = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/hr/holidays?id=${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Advance Salary APIs
export const createAdvanceSalary = async (data) => {
  try {
    const response = await axios.post(`${base_url}/hr/advance-salary`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getAdvanceSalaries = async (month, type) => {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (type) params.append('type', type);
    
    const url = params.toString()
      ? `${base_url}/hr/advance-salary?${params.toString()}`
      : `${base_url}/hr/advance-salary`;
    
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateAdvanceSalary = async (id, data) => {
  try {
    const response = await axios.patch(`${base_url}/hr/advance-salary?id=${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const getAttendanceSummary = async (month, staffId, type) => {
  try {
    const response = await axios.get(`${base_url}/hr/attendance-summary?month=${month}&staffId=${staffId}&type=${type}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};


export const getPayrollSheet = async (month, type) => {
  try {
    const response = await axios.get(`${base_url}/hr/payroll-sheet?month=${month}&type=${type}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const upsertPayroll = async (data) => {
  try {
    const response = await axios.post(`${base_url}/hr/payroll`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteAdvanceSalary = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/hr/advance-salary?id=${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ==================== FINANCE ====================

// Income
export const getFinanceIncomes = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    
    const url = params.toString()
      ? `${base_url}/finance/income?${params.toString()}`
      : `${base_url}/finance/income`;
    
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createFinanceIncome = async (data) => {
  try {
    const response = await axios.post(`${base_url}/finance/income`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteFinanceIncome = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/finance/income/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Expense
export const getFinanceExpenses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    
    const url = params.toString()
      ? `${base_url}/finance/expense?${params.toString()}`
      : `${base_url}/finance/expense`;
    
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createFinanceExpense = async (data) => {
  try {
    const response = await axios.post(`${base_url}/finance/expense`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteFinanceExpense = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/finance/expense/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Closing
export const getFinanceClosings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    
    const url = params.toString()
      ? `${base_url}/finance/closing?${params.toString()}`
      : `${base_url}/finance/closing`;
    
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createFinanceClosing = async (data) => {
  try {
    const response = await axios.post(`${base_url}/finance/closing`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// ========== CONFIGURATION ==========
// Institute Settings
export const getInstituteSettings = async () => {
  try {
    const response = await axios.get(`${base_url}/configuration/institute-settings`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateInstituteSettings = async (data) => {
  try {
    const response = await axios.patch(`${base_url}/configuration/institute-settings`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Report Card Templates
export const getReportCardTemplates = async () => {
  try {
    const response = await axios.get(`${base_url}/configuration/report-card-templates`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const createReportCardTemplate = async (data) => {
  try {
    const response = await axios.post(`${base_url}/configuration/report-card-templates`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const updateReportCardTemplate = async (id, data) => {
  try {
    const response = await axios.patch(`${base_url}/configuration/report-card-templates/${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteReportCardTemplate = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/configuration/report-card-templates/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

// Finance Closing - Update and Delete
export const updateFinanceClosing = async ({ id, data }) => {
  try {
    const response = await axios.patch(`${base_url}/finance/closing/${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};

export const deleteFinanceClosing = async (id) => {
  try {
    const response = await axios.delete(`${base_url}/finance/closing/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};



export const getDashboardStats = async () => {
  try {
    const response = await axios.get(`${base_url}/dashboard/stats`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    throw { message, status: error.response?.status || 500 };
  }
};
