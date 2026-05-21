import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { useGetAllRolesQuery } from "../../Core/Data/Redux/Roles";
import {
  Permission as PermissionType,
  useGetAllPermissionsQuery,
  useGetRolePermissionsQuery,
  useReplaceRolePermissionsMutation,
} from "../../Core/Data/Redux/Permissions";
import { CheckLineIcon, LockIcon } from "../../icons";

export default function Permission() {
  const { data: rolesData, isLoading: isRolesLoading } = useGetAllRolesQuery();
  const { data: permissionsData, isLoading: isPermissionsLoading } = useGetAllPermissionsQuery();
  const [replaceRolePermissions, { isLoading: isSaving }] = useReplaceRolePermissionsMutation();

  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const permissions = useMemo(() => permissionsData?.data ?? [], [permissionsData]);

  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const { data: rolePermissionData, isFetching: isRolePermissionsFetching } = useGetRolePermissionsQuery(
    selectedRoleId as number,
    { skip: selectedRoleId === "" }
  );

  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === "") {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (rolePermissionData?.data) {
      setSelectedPermissionIds(rolePermissionData.data);
    } else if (selectedRoleId === "") {
      setSelectedPermissionIds([]);
    }
  }, [rolePermissionData, selectedRoleId]);

  const togglePermission = (permissionId: number) => {
    setStatusMessage("");
    setErrorMessage("");
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    );
  };

  const handleRoleChange = (value: string) => {
    setSelectedRoleId(value ? Number(value) : "");
    setSelectedPermissionIds([]);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSave = async () => {
    if (selectedRoleId === "") {
      setErrorMessage("Please select a role first.");
      return;
    }

    try {
      await replaceRolePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermissionIds,
      }).unwrap();
      setStatusMessage("Permissions updated successfully.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not update permissions. Please try again.");
      setStatusMessage("");
    }
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionType[]>>((groups, permission) => {
      const groupName = permission.name.includes(".")
        ? permission.name.split(".")[0]
        : permission.name.split(" ")[0] || "General";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const selectedCount = selectedPermissionIds.length;

  return (
    <>
      <PageMeta title="Permission | Admin Portal" description="Assign permissions to roles" />
      <PageBreadcrumb pageTitle="Permission" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Select Role
              </label>
              <select
                value={selectedRoleId}
                onChange={(event) => handleRoleChange(event.target.value)}
                disabled={isRolesLoading || roles.length === 0}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 lg:min-w-[320px]"
              >
                <option value="">Choose a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <div className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {selectedCount} selected
              </div>
              <Button size="sm" onClick={handleSave} disabled={isSaving || selectedRoleId === ""}>
                {isSaving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>

          {selectedRole && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <LockIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{selectedRole.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Toggle permissions below, then save changes.
                </p>
              </div>
            </div>
          )}

          {(statusMessage || errorMessage) && (
            <p
              className={`mt-5 rounded-lg px-3 py-2 text-sm ${
                errorMessage
                  ? "border border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
                  : "border border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
              }`}
            >
              {errorMessage || statusMessage}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-gray-200 p-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">All Permissions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {permissions.length} permission{permissions.length === 1 ? "" : "s"} available
              </p>
            </div>
            {isRolePermissionsFetching && (
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading role permissions...</span>
            )}
          </div>

          <div className="p-5 lg:p-6">
            {isPermissionsLoading ? (
              <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading permissions...</p>
            ) : permissions.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No permissions found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {Object.entries(groupedPermissions).map(([groupName, groupPermissions]) => (
                  <div key={groupName} className="rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                      <h4 className="text-sm font-semibold capitalize text-gray-800 dark:text-white/90">
                        {groupName}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
                      {groupPermissions.map((permission) => {
                        const checked = selectedPermissionIds.includes(permission.id);

                        return (
                          <label
                            key={permission.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition ${
                              checked
                                ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={selectedRoleId === "" || isRolePermissionsFetching}
                              onChange={() => togglePermission(permission.id)}
                              className="sr-only"
                            />
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-brand-500 bg-brand-500 text-white"
                                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                              }`}
                            >
                              {checked && <CheckLineIcon className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0 truncate">{permission.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
