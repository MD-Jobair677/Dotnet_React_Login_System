import { FormEvent, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";
import {
  Student,
  useGetAllStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from "../../Core/Data/Redux/Students";

export default function Students() {
  const { data, isLoading, isFetching } = useGetAllStudentsQuery();
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const students = useMemo(() => data?.data ?? [], [data]);
  const isSaving = isCreating || isUpdating;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setEditingStudent(null);
    setErrorMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fName = firstName.trim();
    const lName = lastName.trim();
    const mail = email.trim();

    if (!fName || !lName || !mail) {
      setErrorMessage("First name, last name and email are required.");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", fName);
    formData.append("lastName", lName);
    formData.append("email", mail);
    if (phone.trim()) formData.append("phone", phone.trim());
    if (address.trim()) formData.append("address", address.trim());

    try {
      if (editingStudent) {
        await updateStudent({ id: editingStudent.id, formData }).unwrap();
      } else {
        await createStudent(formData).unwrap();
      }
      resetForm();
    } catch {
      setErrorMessage("Could not save this student. Please check the details and try again.");
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setEmail(student.email);
    setPhone(student.phone ?? "");
    setAddress(student.address ?? "");
    setErrorMessage("");
  };

  const handleDelete = async (student: Student) => {
    const confirmed = window.confirm(`Delete "${student.firstName} ${student.lastName}"?`);
    if (!confirmed) return;

    try {
      await deleteStudent(student.id).unwrap();
      if (editingStudent?.id === student.id) resetForm();
    } catch {
      setErrorMessage("Could not delete this student.");
    }
  };

  return (
    <>
      <PageMeta title="Students | Admin Portal" description="Manage students" />
      <PageBreadcrumb pageTitle="Students" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingStudent ? "Update Student" : "Add Student"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the student details below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>First Name</Label>
              <Input
                type="text"
                value={firstName}
                placeholder="Enter first name"
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <Label>Last Name</Label>
              <Input
                type="text"
                value={lastName}
                placeholder="Enter last name"
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                placeholder="student@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                type="text"
                value={phone}
                placeholder="+1 234 567 890"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label>Address</Label>
              <textarea
                value={address}
                rows={3}
                placeholder="Enter address"
                onChange={(e) => setAddress(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving..." : editingStudent ? "Update Student" : "Add Student"}
              </Button>
              {editingStudent && (
                <Button size="sm" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-gray-200 p-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Students</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {students.length} student{students.length === 1 ? "" : "s"} found
              </p>
            </div>
            {isFetching && <span className="text-sm text-gray-500 dark:text-gray-400">Refreshing...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Phone</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading students...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {student.id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {student.phone || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 dark:hover:text-brand-300"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(student)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-warning-300 hover:text-warning-600 dark:border-gray-700 dark:text-gray-400"
                            title="Edit student"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student)}
                            disabled={isDeleting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-error-300 hover:text-error-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400"
                            title="Delete student"
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} className="max-w-[520px] p-6 lg:p-8">
        <div className="pr-10">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {selectedStudent?.firstName} {selectedStudent?.lastName}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Student Details</p>
        </div>
        <div className="mt-6 space-y-3">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase">Email</span>
            <p className="text-sm text-gray-800 dark:text-white/90">{selectedStudent?.email}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase">Phone</span>
            <p className="text-sm text-gray-800 dark:text-white/90">{selectedStudent?.phone || "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase">Address</span>
            <p className="text-sm text-gray-800 dark:text-white/90">{selectedStudent?.address || "—"}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
