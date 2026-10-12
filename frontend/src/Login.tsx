import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import api from "./api";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const switchMode = () => {
    setIsRegistering((current) => !current);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        setIsRegistering(false);
        setMessage("Account created successfully. Please log in.");
      } else {
        const response = await api.post<{ token: string }>("/Auth/login", {
          username: trimmedUsername,
          password,
        });

        if (!response.data.token) {
          setError("Login failed. Please try again.");
          return;
        }

        localStorage.setItem("token", response.data.token);
        window.location.reload();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError("Unable to connect. Please try again.");
        } else if (
          typeof err.response.data === "string" &&
          err.response.data.trim()
        ) {
          setError(err.response.data);
        } else {
          setError(
            isRegistering
              ? "Registration failed. Please check your details."
              : "Login failed. Please check your username and password."
          );
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
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          autoComplete={isRegistering ? "new-password" : "current-password"}
          required
          disabled={loading}
          onChange={(event) => setPassword(event.target.value)}
        />

        {isRegistering && (
          <>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              autoComplete="new-password"
              required
              disabled={loading}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
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

        <button type="button" onClick={switchMode} disabled={loading}>
          {isRegistering ? "Back to Login" : "Sign up"}
        </button>
      </form>
    </div>
  );
}

export default Login;