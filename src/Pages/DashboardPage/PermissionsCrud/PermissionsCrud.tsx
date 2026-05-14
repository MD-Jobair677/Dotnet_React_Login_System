import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../Core/Data/Redux/authSlice';
import type { AppDispatch } from '../../../Core/Data/Redux/store';
import {
  useGetAllPermissionsQuery,
  useGetRolePermissionsQuery,
  useReplaceRolePermissionsMutation,
} from '../../../Core/Data/Redux/Permissions';
import {
  useGetAllRolesQuery,
} from '../../../Core/Data/Redux/Roles';

export default function PermissionsCrud() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    data: permissionsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllPermissionsQuery();

  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
  } = useGetAllRolesQuery();

  const permissions = useMemo(() => permissionsResponse?.data ?? [], [permissionsResponse]);
  const roles = useMemo(() => rolesResponse?.data ?? [], [rolesResponse]);

  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const {
    data: rolePermissionsResponse,
    isFetching: isRolePermissionsLoading,
  } = useGetRolePermissionsQuery(selectedRoleId, {
    skip: !selectedRoleId,
  });

  const [replaceRolePermissions, { isLoading: isSaving }] = useReplaceRolePermissionsMutation();

  useEffect(() => {
    setSelectedPermissionIds(rolePermissionsResponse?.data ?? []);
  }, [rolePermissionsResponse]);

  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissionIds),
    [selectedPermissionIds],
  );

  const savedPermissionIds = useMemo(
    () => rolePermissionsResponse?.data ?? [],
    [rolePermissionsResponse],
  );

  const hasChanges = useMemo(() => {
    if (selectedPermissionIds.length !== savedPermissionIds.length) return true;

    const savedSet = new Set(savedPermissionIds);
    return selectedPermissionIds.some((permissionId) => !savedSet.has(permissionId));
  }, [savedPermissionIds, selectedPermissionIds]);

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((currentIds) => {
      if (currentIds.includes(permissionId)) {
        return currentIds.filter((id) => id !== permissionId);
      }

      return [...currentIds, permissionId];
    });
  };

  const handleRoleChange = (roleId: number) => {
    setSelectedRoleId(roleId);
    setSelectedPermissionIds([]);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      alert('Please select a role first');
      return;
    }

    try {
      await replaceRolePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermissionIds,
      }).unwrap();
      alert('Role permissions saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save role permissions');
    }
  };

  const resetPermissions = () => {
    setSelectedPermissionIds(savedPermissionIds);
  };

  const isBusy = isSaving || isRolePermissionsLoading;
  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  useEffect(() => {
    if (!isError || !error) return;

    const status =
      typeof (error as { status?: number })?.status === 'number'
        ? (error as { status: number }).status
        : null;

    if (status === 401 || status === 403) {
      dispatch(logout());
      localStorage.removeItem('auth_session');
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    }
  }, [dispatch, error, isError, navigate]);

  return (
    <div className="dashboard-content">
      <section className="dashboard-heading">
        <div>
          <h1>Permissions</h1>
          <p>Select a role, then choose every permission that belongs under it.</p>
        </div>
      </section>

      {!isLoading && !isError && (
        <section className="panel permission-role-panel">
          <label className="permission-role-select">
            <span>Role</span>
            <select
              value={selectedRoleId}
              onChange={(e) => handleRoleChange(Number(e.target.value))}
              disabled={isSaving || isRolesLoading || roles.length === 0}
            >
              <option value={0}>
                {roles.length === 0 ? 'No roles found' : 'Select a role'}
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <div className="permission-role-summary">
            <strong>{selectedRole ? selectedRole.name : 'No role selected'}</strong>
            <span>
              {selectedRoleId
                ? `${selectedPermissionIds.length} of ${permissions.length} permissions selected`
                : 'Choose a role to edit permissions'}
            </span>
          </div>

          <div className="permission-role-actions">
            <button
              type="button"
              onClick={resetPermissions}
              disabled={!selectedRoleId || isBusy || !hasChanges}
            >
              Reset
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleSavePermissions}
              disabled={!selectedRoleId || isBusy || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </section>
      )}

      {isLoading && <p style={{ color: '#94a3b8' }}>Loading permissions...</p>}
      {isError && (
        <div className="auth-alert" style={{ marginBottom: 16 }}>
          Failed to load permissions.
          <button type="button" onClick={() => refetch()} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <section className="panel">
          <div className="panel-title">
            <h2>Permission List</h2>
            <span>
              {isRolePermissionsLoading ? 'Loading role permissions...' : `${permissions.length} permissions`}
            </span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPermissionSet.has(p.id)}
                          onChange={() => togglePermission(p.id)}
                          disabled={!selectedRoleId || isBusy}
                        />
                        <span>{p.id}</span>
                      </label>
                    </td>
                    <td>{p.name}</td>
                    <td>
                      <span
                        className={
                          selectedPermissionSet.has(p.id)
                            ? 'permission-status enabled'
                            : 'permission-status'
                        }
                      >
                        {selectedPermissionSet.has(p.id) ? 'Selected' : 'Not selected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
