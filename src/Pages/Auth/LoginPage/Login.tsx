import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../Core/Data/Redux/authSlice';
import type { AppDispatch } from '../../../Core/Data/Redux/store';
import { useLoginUserMutation, useRegisterUserMutation } from '../../../Core/Data/Redux/Register';
import './login.css';

type SafeUser = {
  id?: number | string;
  name: string;
  email: string;
};

type Mode = 'login' | 'register' | 'success';
type FormErrors = Record<string, string>;

const SESSION_KEY = 'auth_session';

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (source: Record<string, unknown> | undefined, key: string) => {
  const value = source?.[key];
  return typeof value === 'string' ? value : '';
};

const readId = (source: Record<string, unknown> | undefined) => {
  const id = source?.id ?? source?.userId;
  return typeof id === 'string' || typeof id === 'number' ? id : undefined;
};

const getApiMessage = (error: unknown) => {
  if (!isRecord(error)) return 'Request failed. Please try again.';
  const data = error.data;

  if (isRecord(data)) {
    return readString(data, 'message') || readString(data, 'error') || 'Request failed. Please try again.';
  }

  return readString(error, 'message') || 'Request failed. Please try again.';
};

const getAuthData = (response: unknown, fallbackEmail: string, fallbackName = 'User') => {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : root;
  const user = isRecord(data.user) ? data.user : isRecord(root.user) ? root.user : data;
  const token =
    readString(data, 'token') ||
    readString(data, 'accessToken') ||
    readString(data, 'jwtToken') ||
    readString(root, 'token') ||
    readString(root, 'accessToken');
  const firstName = readString(user, 'firstName');
  const lastName = readString(user, 'lastName');
  const name = readString(user, 'name') || [firstName, lastName].filter(Boolean).join(' ') || fallbackName;
  const email = readString(user, 'email') || fallbackEmail;

  return {
    token,
    user,
    safeUser: {
      id: readId(user),
      name,
      email,
    } satisfies SafeUser,
  };
};

function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={error ? 'has-error' : ''}
      />
      {error && <small>{error}</small>}
    </label>
  );
}

function LoginForm({ onLogin, onSwitch }: { onLogin: (user: SafeUser) => void; onSwitch: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!isEmail(email)) nextErrors.email = 'Enter a valid email address';

    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const response = await loginUser({ email: email.trim(), password }).unwrap();
      const authData = getAuthData(response, email.trim());

      if (authData.token) {
        dispatch(setCredentials({ token: authData.token, user: authData.user }));
      }

      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(authData.safeUser));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }

      onLogin(authData.safeUser);
    } catch (error) {
      setErrors({ general: getApiMessage(error) });
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <span className="auth-mark">IN</span>
        <h1>Welcome Back</h1>
        <p>Sign in to continue to your dashboard.</p>
      </div>

      {errors.general && <div className="auth-alert">{errors.general}</div>}

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setErrors((current) => ({ ...current, email: '', general: '' }));
        }}
        error={errors.email}
        autoComplete="email"
      />

      <div className="password-row">
        <Field
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: '', general: '' }));
          }}
          error={errors.password}
          autoComplete="current-password"
        />
        <button type="button" onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      <label className="auth-check">
        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
        <span>Remember me</span>
      </label>

      <button className="auth-submit" type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <p className="auth-switch">
        Do not have an account?
        <button type="button" onClick={onSwitch}>
          Register
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 5);
  }, [password]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) nextErrors.firstName = 'First name is required';
    else if (firstName.trim().length < 2) nextErrors.firstName = 'First name must be at least 2 characters';

    if (!lastName.trim()) nextErrors.lastName = 'Last name is required';
    else if (lastName.trim().length < 2) nextErrors.lastName = 'Last name must be at least 2 characters';

    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!isEmail(email)) nextErrors.email = 'Enter a valid email address';

    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';

    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      }).unwrap();

      setSuccessMessage('Registration successful. Please login now.');
      setTimeout(() => onSwitch(), 700);
    } catch (error) {
      setErrors({ general: getApiMessage(error) });
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <span className="auth-mark">UP</span>
        <h1>Create Account</h1>
        <p>Register once, then login with your new account.</p>
      </div>

      {errors.general && <div className="auth-alert">{errors.general}</div>}
      {successMessage && <div className="auth-notice">{successMessage}</div>}

      <Field
        label="First Name"
        value={firstName}
        onChange={(event) => {
          setFirstName(event.target.value);
          setSuccessMessage('');
          setErrors((current) => ({ ...current, firstName: '', general: '' }));
        }}
        error={errors.firstName}
        autoComplete="given-name"
      />
      <Field
        label="Last Name"
        value={lastName}
        onChange={(event) => {
          setLastName(event.target.value);
          setSuccessMessage('');
          setErrors((current) => ({ ...current, lastName: '', general: '' }));
        }}
        error={errors.lastName}
        autoComplete="family-name"
      />
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setSuccessMessage('');
          setErrors((current) => ({ ...current, email: '', general: '' }));
        }}
        error={errors.email}
        autoComplete="email"
      />
     
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setSuccessMessage('');
          setErrors((current) => ({ ...current, password: '', general: '' }));
        }}
        error={errors.password}
        autoComplete="new-password"
      />

      {password && (
        <div className="strength" aria-label="Password strength">
          {[1, 2, 3, 4, 5].map((item) => (
            <span key={item} className={item <= strength ? 'active' : ''} />
          ))}
        </div>
      )}

      <Field
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          setSuccessMessage('');
          setErrors((current) => ({ ...current, confirmPassword: '', general: '' }));
        }}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <button className="auth-submit" type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>

      <p className="auth-switch">
        Already have an account?
        <button type="button" onClick={onSwitch}>
          Login
        </button>
      </p>
    </form>
  );
}

function SuccessScreen({ user, onLogout }: { user: SafeUser; onLogout: () => void }) {
  return (
    <div className="auth-success">
      <span className="auth-mark">{user.name.slice(0, 2).toUpperCase()}</span>
      <h1>Login Successful</h1>
      <p>{user.name}</p>
      <p>{user.email}</p>
      <button className="auth-submit" type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export const Login = () => {
  const [user, setUser] = useState<SafeUser | null>(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as SafeUser | null;
      if (savedUser?.id && savedUser.name && savedUser.email) {
        return savedUser;
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    return null;
  });
  const [mode, setMode] = useState<Mode>(() => (user ? 'success' : 'login'));

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('token');
    setMode('login');
  };

  return (
    <main className="login-page">
      <section className="auth-card">
        {mode !== 'success' && (
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
              Login
            </button>
            <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
              Register
            </button>
          </div>
        )}

        {mode === 'login' && (
          <LoginForm
            onLogin={(safeUser) => {
              setUser(safeUser);
              setMode('success');
            }}
            onSwitch={() => setMode('register')}
          />
        )}

        {mode === 'register' && <RegisterForm onSwitch={() => setMode('login')} />}
        {mode === 'success' && user && <SuccessScreen user={user} onLogout={handleLogout} />}
      </section>
    </main>
  );
};

export default Login;
