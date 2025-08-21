/**
 * @file SignUp.jsx
 * @module SignUp
 * @date 2025-08-13
 * @author Talin
 * @description
 *   React component for user registration using Supabase authentication.
 *   Collects user name, email, and password, validates input, and submits to backend.
 *
 * @component
 * @example
 * return <SignUp />;
 *
 * @function handleChange
 * @description Updates form state when input fields change.
 * @param {object} event - Change event from input.
 * @returns {void}
 *
 * @function validate
 * @description Validates name, email, and password fields.
 * @returns {boolean} True if all fields are valid, otherwise false.
 *
 * @function handleSubmit
 * @description Submits signup form data to Supabase, navigates to home on success.
 * @param {object} e - Form submit event.
 * @returns {Promise<void>}
 */


// frontend/src/components/SignUp.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// MUI imports
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

export default function SignUp() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");

        try {
            const res = await fetch("/api/users/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const result = await res.json();
            if (!res.ok) {
                setSubmitError(result.error || "Sign-in failed");
                return;
            }
            const { access_token } = result;
            localStorage.setItem("access_token", access_token);
            setUserData({ email, access_token });
            navigate("/");

            // Optionally: store remembered credentials for autofill (not required for auth)
            if (remember) {
                try {
                    localStorage.setItem(
                        "savedCredentials",
                        JSON.stringify({
                            [email]: { password, savedAt: Date.now() },
                        })
                    );
                } catch {}
            }
        } catch (error) {
            setSubmitError("Sign-in failed. Try again later.");
        }
    };

    return (
        <React.Fragment>
            <CssBaseline enableColorScheme />
            <Stack
                sx={{ minHeight: "100vh" }}
                alignItems="center"
                justifyContent="center"
                spacing={2}
            >
                <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Sign up
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                        <FormControl fullWidth>
                            <FormLabel>Name</FormLabel>
                            <TextField
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                fullWidth
                            />
                        </FormControl>

                        <FormControl fullWidth>
                            <FormLabel>Email</FormLabel>
                            <TextField
                                name="email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                            />
                        </FormControl>

                        <FormControl fullWidth>
                            <FormLabel>Password</FormLabel>
                            <TextField
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                            />
                        </FormControl>

                        {submitError && <Typography color="error">{submitError}</Typography>}
                        {submitSuccess && <Typography color="primary">{submitSuccess}</Typography>}

                        <Button type="submit" variant="contained" fullWidth>
                            Create account
                        </Button>
                    </Box>
                </Paper>

                <Button variant="text" onClick={() => navigate("/signin")}>
                    Already have an account? Sign in →
                </Button>
            </Stack>
        </React.Fragment>
    );
}
