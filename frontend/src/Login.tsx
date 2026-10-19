import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import api from "./api";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const switchMode = () => {
    setIsRegistering((current) => !current);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError("Please enter your username and password.");
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await api.post("/Auth/register", {
          username: trimmedUsername,
          password,
        });

        setUsername(trimmedUsername);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsRegistering(false);
        setMessage("Account created successfully. Please log in.");
      } else {
        const response = await api.post<{ token: string }>(
          "/Auth/login",
          {
            username: trimmedUsername,
            password,
          }
        );

        if (!response.data.token) {
          setError("Login failed. Please try again.");
          return;
        }

        localStorage.setItem("token", response.data.token);
        window.location.reload();
      }
    } catch (err: unknown) {
      const fallback = isRegistering
        ? "Registration failed. Please check your details."
        : "Login failed. Please check your username and password.";

      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError("Unable to connect. Please try again.");
        } else {
          const data: unknown = err.response.data;
          const messages: string[] = [];

          if (
            err.response.status === 400 &&
            typeof data === "object" &&
            data !== null &&
            "errors" in data
          ) {
            const validationErrors = data.errors;

            if (
              typeof validationErrors === "object" &&
              validationErrors !== null
            ) {
              for (const value of Object.values(validationErrors)) {
                if (Array.isArray(value)) {
                  for (const validationMessage of value) {
                    if (
                      typeof validationMessage === "string" &&
                      validationMessage.trim()
                    ) {
                      messages.push(validationMessage.trim());
                    }
                  }
                }
              }
            }
          }

          if (messages.length > 0) {
            setError([...new Set(messages)].join(" "));
          } else if (
            typeof data === "string" &&
            data.trim()
          ) {
            setError(data);
          } else {
            setError(fallback);
          }
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>{isRegistering ? "Create Account" : "Login"}</h2>

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          autoComplete="username"
          required
          disabled={loading}
          onChange={(event) => setUsername(event.target.value)}
        />

        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            autoComplete={
              isRegistering ? "new-password" : "current-password"
            }
            required
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
            aria-controls="password"
            aria-pressed={showPassword}
            disabled={loading}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        </div>

        {isRegistering && (
          <>
            <label htmlFor="confirm-password">
              Confirm Password
            </label>

            <div className="password-field">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                autoComplete="new-password"
                required
                disabled={loading}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                aria-controls="confirm-password"
                aria-pressed={showConfirmPassword}
                disabled={loading}
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} aria-hidden="true" />
                ) : (
                  <Eye size={20} aria-hidden="true" />
                )}
              </button>
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isRegistering
              ? "Create Account"
              : "Login"}
        </button>

        <p>
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}
        </p>

        <button
          type="button"
          onClick={switchMode}
          disabled={loading}
        >
          {isRegistering ? "Back to Login" : "Sign up"}
        </button>
      </form>
    </div>
  );
}

export default Login;