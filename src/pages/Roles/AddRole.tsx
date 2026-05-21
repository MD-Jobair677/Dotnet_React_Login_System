import { FormEvent, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import {
  Role,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetAllRolesQuery,
  useUpdateRoleMutation,
} from "../../Core/Data/Redux/Roles";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../icons";

export default function AddRole() {
  const { data, isLoading, isFetching } = useGetAllRolesQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const roles = useMemo(() => data?.data ?? [], [data]);
  const isSaving = isCreating || isUpdating;

  const resetForm = () => {
    setRoleName("");
    setDescription("");
    setEditingRole(null);
    setErrorMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = roleName.trim();

    if (!name) {
      setErrorMessage("Role name is required.");
      return;
    }

    try {
      if (editingRole) {
        await updateRole({ id: editingRole.id, name, description: description.trim() }).unwrap();
      } else {
        await createRole({ name, description: description.trim() }).unwrap();
      }
      resetForm();
    } catch {
      setErrorMessage("Could not save this role. Please check the name and try again.");
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setDescription(role.description ?? "");
    setErrorMessage("");
  };

  const handleDelete = async (role: Role) => {
    const confirmed = window.confirm(`Delete "${role.name}" role?`);
    if (!confirmed) return;

    try {
      await deleteRole(role.id).unwrap();
      if (editingRole?.id === role.id) resetForm();
    } catch {
      setErrorMessage("Could not delete this role. It may already be assigned to users.");
    }
  };

  return (
    <>
      <PageMeta title="Add Role | Admin Portal" description="Manage user roles and role permissions" />
      <PageBreadcrumb pageTitle="Add Role" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingRole ? "Update Role" : "Create Role"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Keep role names clear and easy to scan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Role Name</Label>
              <Input
                type="text"
                value={roleName}
                placeholder="Example: Manager"
                onChange={(event) => setRoleName(event.target.value)}
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={description}
                rows={4}
                placeholder="Shortly describe what this role can do"
                onChange={(event) => setDescription(event.target.value)}
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
                {isSaving ? "Saving..." : editingRole ? "Update Role" : "Add Role"}
              </Button>
              {editingRole && (
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Roles</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {roles.length} role{roles.length === 1 ? "" : "s"} available
              </p>
            </div>
            {isFetching && <span className="text-sm text-gray-500 dark:text-gray-400">Refreshing...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Permissions</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading roles...
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800 dark:text-white/90">{role.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {role.id}</p>
                      </td>
                      <td className="max-w-[320px] px-5 py-4">
                        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                          {role.description || "No description"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                          {role.permissions?.length ?? 0} assigned
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRole(role)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 dark:hover:text-brand-300"
                            title="View permissions"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(role)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-warning-300 hover:text-warning-600 dark:border-gray-700 dark:text-gray-400"
                            title="Edit role"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(role)}
                            disabled={isDeleting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-error-300 hover:text-error-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400"
                            title="Delete role"
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

      <Modal isOpen={!!selectedRole} onClose={() => setSelectedRole(null)} className="max-w-[520px] p-6 lg:p-8">
        <div className="pr-10">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">{selectedRole?.name} Permissions</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Permissions currently assigned to this role.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {selectedRole?.permissions?.length ? (
            selectedRole.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {permission}
              </span>
            ))
          ) : (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              No permissions assigned yet.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
