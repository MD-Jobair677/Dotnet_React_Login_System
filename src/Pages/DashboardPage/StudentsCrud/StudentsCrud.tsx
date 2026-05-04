import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../Core/Data/Redux/authSlice';
import type { AppDispatch } from '../../../Core/Data/Redux/store';
import {
  useCreateStudentMutation,
  useDeleteStudentMutation,
  useGetAllStudentsQuery,
  useUpdateStudentMutation,
  type Student,
} from '../../../Core/Data/Redux/Students';

type StudentFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profileImage: File | null;
};

type EditState = {
  mode: 'create' | 'edit';
  id?: number;
  initial: StudentFormState;
};

const API_BASE = 'http://localhost:5020/';

function resolveImageSrc(profileImage?: string | null) {
  if (!profileImage) return '';
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) return profileImage;
  if (profileImage.startsWith('/')) return `${API_BASE.replace(/\/$/, '')}${profileImage}`;
  return `${API_BASE}${profileImage}`;
}

function toFormDataCreate(state: StudentFormState) {
  const formData = new FormData();
  formData.set('FirstName', state.firstName.trim());
  formData.set('LastName', state.lastName.trim());
  formData.set('Email', state.email.trim());
  formData.set('Phone', state.phone.trim());
  formData.set('Address', state.address.trim());
  if (state.profileImage) formData.set('ProfileImage', state.profileImage);
  return formData;
}

function toFormDataUpdate(
  state: { id: number; firstName: string; lastName: string; phone: string; address: string },
  includeImage: boolean,
  file?: File | null
) {
  const formData = new FormData();
  formData.set('id', String(state.id));
  formData.set('FirstName', state.firstName.trim());
  formData.set('LastName', state.lastName.trim());
  formData.set('Phone', state.phone.trim());
  formData.set('Address', state.address.trim());
  if (includeImage && file) formData.set('ProfileImage', file);
  return formData;
}

function emptyFormState(): StudentFormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    profileImage: null,
  };
}

export default function StudentsCrud() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    data: studentsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllStudentsQuery();

  const students = useMemo(() => studentsResponse?.data ?? [], [studentsResponse]);

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

  const [edit, setEdit] = useState<EditState | null>(null);
  const [form, setForm] = useState<StudentFormState>(() => emptyFormState());
  const [formError, setFormError] = useState<string>('');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const startCreate = () => {
    setFormError('');
    setForm(emptyFormState());
    setEdit({ mode: 'create', initial: emptyFormState() });
  };

  const startEdit = (s: Student) => {
    setFormError('');
    setForm({
      firstName: s.firstName ?? '',
      lastName: s.lastName ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      profileImage: null,
    });
    setEdit({ mode: 'edit', id: s.id, initial: emptyFormState() });
  };

  const closeEditor = () => {
    setEdit(null);
    setForm(emptyFormState());
    setFormError('');
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (edit?.mode === 'create' && !form.email.trim()) return 'Email is required';
    if (edit?.mode === 'create') {
      if (!form.email.includes('@') || !form.email.includes('.')) return 'Enter a valid email';
      if (!form.profileImage) return 'Profile image is required';
    }
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
        await createStudent(toFormDataCreate(form)).unwrap();
        closeEditor();
        return;
      }

      // edit mode
      if (edit.id == null) return;
      const includeImage = !!form.profileImage;
      const payload = {
        id: edit.id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
      };

      const formData = toFormDataUpdate(payload, includeImage, form.profileImage);
      await updateStudent({ id: edit.id, formData }).unwrap();
      closeEditor();
    } catch (err) {
      setFormError('Request failed. Please try again.');
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Are you sure you want to delete this student?');
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteStudent(id).unwrap();
      setDeletingId(null);
    } catch (err) {
      setDeletingId(null);
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Delete failed. Please try again.');
    }
  };

  const isBusy = isCreating || isUpdating || isDeleting;

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
          <h1>Students</h1>
          <p>Create, view, update and delete students (CRUD).</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="primary" onClick={startCreate} disabled={isBusy}>
            Add Student
          </button>
        </div>
      </section>

      {isLoading && <p style={{ color: '#94a3b8' }}>Loading students...</p>}
      {isError && (
        <div className="auth-alert" style={{ marginBottom: 16 }}>
          Failed to load students.
          <button type="button" onClick={() => refetch()} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <section className="panel">
          <div className="panel-title">
            <h2>Student List</h2>
            <span>{students.length} students</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      {s.profile?.profileImage ? (
                        <img
                          alt="profile"
                          src={resolveImageSrc(s.profile.profileImage)}
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      {s.firstName} {s.lastName}
                    </td>
                    <td>{s.email}</td>
                    <td>{s.phone ?? '-'}</td>
                    <td>{s.address ?? '-'}</td>
                    <td>
                      <button type="button" onClick={() => startEdit(s)} disabled={isBusy}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        disabled={isBusy || deletingId === s.id}
                        style={{ marginLeft: 8, color: '#fda4af' }}
                      >
                        {deletingId === s.id ? 'Deleting...' : 'Delete'}
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
            <h2>{edit.mode === 'create' ? 'Add Student' : 'Edit Student'}</h2>
            <span>{edit.mode === 'create' ? 'Create' : `#${edit.id}`}</span>
          </div>

          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="auth-alert" style={{ marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label className="auth-field">
                <span>First Name</span>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((cur) => ({ ...cur, firstName: e.target.value }))}
                />
              </label>

              <label className="auth-field">
                <span>Last Name</span>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((cur) => ({ ...cur, lastName: e.target.value }))}
                />
              </label>

              {edit.mode === 'create' && (
                <label className="auth-field">
                  <span>Email</span>
                  <input value={form.email} onChange={(e) => setForm((cur) => ({ ...cur, email: e.target.value }))} />
                </label>
              )}

              {edit.mode === 'edit' && (
                <label className="auth-field">
                  <span>Email</span>
                  <input value={form.email} disabled />
                </label>
              )}

              <label className="auth-field">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((cur) => ({ ...cur, phone: e.target.value }))}
                />
              </label>

              <label className="auth-field">
                <span>Address</span>
                <input
                  value={form.address}
                  onChange={(e) => setForm((cur) => ({ ...cur, address: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="auth-field">
                <span>{edit.mode === 'create' ? 'Profile Image (required)' : 'Profile Image (optional)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm((cur) => ({ ...cur, profileImage: file }));
                  }}
                />
              </label>
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
