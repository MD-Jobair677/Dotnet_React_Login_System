import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useGetAllRolesQuery } from "../../Core/Data/Redux/Roles";
import {
  User,
  useGetAllUsersQuery,
  useGetUserRolesQuery,
  useUpdateUserRolesMutation,
} from "../../Core/Data/Redux/Users";
import { CheckLineIcon, GroupIcon, PencilIcon } from "../../icons";

export default function AddRoleToUser() {
  const { data: usersData, isLoading: isUsersLoading, isFetching: isUsersFetching } = useGetAllUsersQuery();
  const { data: rolesData, isLoading: isRolesLoading } = useGetAllRolesQuery();
  const [updateUserRoles, { isLoading: isSaving }] = useUpdateUserRolesMutation();

  const users = useMemo(
    () =>
      (usersData?.data ?? []).map((user) => ({
        ...user,
        roles: user.roles ?? [],
        permissions: user.permissions ?? [],
      })),
    [usersData]
  );
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: userRolesData, isFetching: isUserRolesFetching } = useGetUserRolesQuery(
    selectedUser?.id ?? 0,
    { skip: !selectedUser }
  );

  useEffect(() => {
    if (userRolesData?.data) {
      setSelectedRoleIds(userRolesData.data);
    }
  }, [userRolesData]);

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleIds([]);
    setErrorMessage("");
  };

  const toggleRole = (roleId: number) => {
    setErrorMessage("");
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      await updateUserRoles({ userId: selectedUser.id, roleIds: selectedRoleIds }).unwrap();
      setSelectedUser(null);
      setSelectedRoleIds([]);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not assign roles to this user. Please try again.");
    }
  };

  return (
    <>
      <PageMeta title="Add Role To User | Admin Portal" description="Assign roles to users" />
      <PageBreadcrumb pageTitle="Add Role To User" />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">User Role Assignment</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review users, their roles, and permissions from one place.
            </p>
          </div>
          {isUsersFetching && <span className="text-sm text-gray-500 dark:text-gray-400">Refreshing...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Roles</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Permission</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isUsersLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                          {(user.firstName || user.email).charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-[260px] flex-wrap gap-1.5">
                        {user.roles.length ? (
                          user.roles.map((role) => (
                            <span key={role} className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-[360px] flex-wrap gap-1.5">
                        {user.permissions.length ? (
                          user.permissions.slice(0, 6).map((permission) => (
                            <span key={permission} className="rounded-full border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                              {permission}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No permissions</span>
                        )}
                        {user.permissions.length > 6 && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            +{user.permissions.length - 6}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openRoleModal(user)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:text-brand-300"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Add Role
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

      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} className="max-w-[620px] p-6 lg:p-8">
        <div className="pr-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <GroupIcon className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">Assign Roles</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isRolesLoading || isUserRolesFetching ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Loading roles...
            </p>
          ) : roles.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              No roles available.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {roles.map((role) => {
                const checked = selectedRoleIds.includes(role.id);

                return (
                  <label
                    key={role.id}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      checked
                        ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                      className="sr-only"
                    />
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                        }`}
                      >
                        {checked && <CheckLineIcon className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                          {role.name}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                          {role.description || `${role.permissions?.length ?? 0} permission assigned`}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="mt-5 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || isUserRolesFetching}>
            {isSaving ? "Saving..." : "Save Roles"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
