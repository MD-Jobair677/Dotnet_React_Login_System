import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../Core/Data/Redux/authSlice';
import type { AppDispatch } from '../../../Core/Data/Redux/store';
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetAllRolesQuery,
  useUpdateRoleMutation,
} from '../../../Core/Data/Redux/Roles';
import {
  useGetAllPermissionsQuery,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from '../../../Core/Data/Redux/Permissions';
import type { Role } from '../../../Core/Data/Redux/Roles';

type EditState = {
  mode: 'create' | 'edit';
  id?: number;
};

export default function RolesCrud() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    data: rolesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllRolesQuery();

  const {
    data: permissionsResponse,
    isLoading: permissionsLoading,
  } = useGetAllPermissionsQuery();

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [updateRolePermissions, { isLoading: isUpdatingPermissions }] = useUpdateRolePermissionsMutation();

  const roles = useMemo(() => rolesResponse?.data ?? [], [rolesResponse]);
  const permissions = useMemo(() => permissionsResponse?.data ?? [], [permissionsResponse]);
  const permissionNames = useMemo(() => permissions.map(p => p.name), [permissions]);

  const [edit, setEdit] = useState<EditState | null>(null);
  const [name, setName] = useState('');
  const [selectedPermissionNames, setSelectedPermissionNames] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: rolePermissionsData, refetch: refetchRolePerms } = useGetRolePermissionsQuery(edit?.id ?? 0, {
    skip: !edit?.id || edit.mode !== 'edit',
  });

  useEffect(() => {
    if (rolePermissionsData?.data && edit?.mode === 'edit') {
      const permNames = rolePermissionsData.data.map((id) => permissionNames[id - 1]).filter(Boolean);
      setSelectedPermissionNames(permNames);
    }
  }, [rolePermissionsData, edit?.mode, permissionNames]);

  useEffect(() => {
    if (edit?.mode === 'edit') {
      refetchRolePerms();
    }
  }, [edit?.id, edit?.mode, refetchRolePerms]);

  const startCreate = () => {
    setFormError('');
    setName('');
    setSelectedPermissionNames([]);
    setEdit({ mode: 'create' });
  };

  const startEdit = (role: Role) => {
    setFormError('');
    setName(role.name);
    setEdit({ mode: 'edit', id: role.id });
  };

  const closeEditor = () => {
    setEdit(null);
    setName('');
    setSelectedPermissionNames([]);
    setFormError('');
  };

  const validate = () => {
    if (!name.trim()) return 'Role name is required';
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }

    try {
      if (!edit) return;

      if (edit.mode === 'create') {
        await createRole({ name: name.trim() }).unwrap();
        closeEditor();
        return;
      }

      if (edit.id == null) return;
      await updateRole({ id: edit.id, name: name.trim() }).unwrap();
      
      if (edit.mode === 'edit') {
        const permissionIds = selectedPermissionNames.map((name) => {
          const perm = permissions.find(p => p.name === name);
          return perm?.id;
        }).filter((id): id is number => id !== undefined);
        
        for (const permId of permissionIds) {
          await updateRolePermissions({ roleId: edit.id, permissionId: permId }).unwrap();
        }
      }
      
      closeEditor();
    } catch (err) {
      setFormError('Request failed. Please try again.');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Are you sure you want to delete this role?');
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteRole(id).unwrap();
      setDeletingId(null);
    } catch (err) {
      setDeletingId(null);
      console.error(err);
      alert('Delete failed. Please try again.');
    }
  };

  const isBusy = isCreating || isUpdating || isDeleting || isUpdatingPermissions;

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
          <h1>Roles</h1>
          <p>Create, view, update and delete roles (CRUD).</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="primary" onClick={startCreate} disabled={isBusy}>
            Add Role
          </button>
        </div>
      </section>

      {isLoading && <p style={{ color: '#94a3b8' }}>Loading roles...</p>}
      {isError && (
        <div className="auth-alert" style={{ marginBottom: 16 }}>
          Failed to load roles.
          <button type="button" onClick={() => refetch()} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <section className="panel">
          <div className="panel-title">
            <h2>Role List</h2>
            <span>{roles.length} roles</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>
                      <button type="button" onClick={() => startEdit(r)} disabled={isBusy}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={isBusy || deletingId === r.id}
                        style={{ marginLeft: 8, color: '#fda4af' }}
                      >
                        {deletingId === r.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {edit && (
        <section
          className="panel"
          style={{
            marginTop: 16,
            padding: 18,
          }}
        >
          <div className="panel-title">
            <h2>{edit.mode === 'create' ? 'Add Role' : 'Edit Role'}</h2>
            <span>{edit.mode === 'create' ? 'Create' : `#${edit.id}`}</span>
          </div>

          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="auth-alert" style={{ marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }}>
              <label className="auth-field">
                <span>Role Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter role name"
                />
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <label className="auth-field">
                <span>Permissions</span>
              </label>
              {permissionsLoading ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading permissions...</p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: 10,
                  marginTop: 8,
                  padding: 12,
                  border: '1px solid #334155',
                  borderRadius: 6,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {permissions.map((perm) => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedPermissionNames.includes(perm.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissionNames([...selectedPermissionNames, perm.name]);
                          } else {
                            setSelectedPermissionNames(selectedPermissionNames.filter(n => n !== perm.name));
                          }
                        }}
                        disabled={isBusy}
                      />
                      <span style={{ fontSize: 14 }}>{perm.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeEditor} disabled={isBusy}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={isBusy}>
                {edit.mode === 'create' ? (isBusy ? 'Saving...' : 'Create') : isBusy ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}