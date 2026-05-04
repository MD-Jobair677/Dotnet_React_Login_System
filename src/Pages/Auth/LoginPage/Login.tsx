import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './login.css';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  password: string;
};

type SafeUser = Pick<AuthUser, 'id' | 'name' | 'email'>;
type Mode = 'login' | 'register' | 'success';
type FormErrors = Record<string, string>;

const USERS_KEY = 'auth_users';
const SESSION_KEY = 'auth_session';

const getStoredUsers = (): AuthUser[] => {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: AuthUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const makeSafeUser = (user: AuthUser): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const user = getStoredUsers().find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
    );

    if (!user) {
      setErrors({ general: 'Email or password is incorrect' });
      return;
    }

    const safeUser = makeSafeUser(user);
    if (remember) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    }

    onLogin(safeUser);
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

      <button className="auth-submit" type="submit">
        Login
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

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

    if (!name.trim()) nextErrors.name = 'Name is required';
    else if (name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters';

    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!isEmail(email)) nextErrors.email = 'Enter a valid email address';

    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';

    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const users = getStoredUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      setErrors({ general: 'An account already exists with this email' });
      return;
    }

    saveUsers([
      ...users,
      {
        id: Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
      },
    ]);

    onSwitch();
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <span className="auth-mark">UP</span>
        <h1>Create Account</h1>
        <p>Register once, then login with your new account.</p>
      </div>

      {errors.general && <div className="auth-alert">{errors.general}</div>}

      <Field
        label="Full name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setErrors((current) => ({ ...current, name: '', general: '' }));
        }}
        error={errors.name}
        autoComplete="name"
      />
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
      <Field
        label="Phone"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        autoComplete="tel"
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
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
          setErrors((current) => ({ ...current, confirmPassword: '', general: '' }));
        }}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <button className="auth-submit" type="submit">
        Register
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
