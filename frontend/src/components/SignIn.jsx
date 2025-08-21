// frontend/src/components/SignIn.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ use deep MUI imports to avoid version/export issues
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

import { useData } from "../contexts/UserContext.jsx";

const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api";


export default function SignIn() {
    const navigate = useNavigate();
    const { setUserData } = useData();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");

        try {
            const res = await fetch(`${API_BASE}/users/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            let result = {};
            try { result = await res.json(); } catch { /* empty/HTML error body */ }

            if (!res.ok) {
                setSubmitError(result.error || "Sign-in failed");
                return;
            }

            const { access_token } = result || {};
            if (!access_token) {
                setSubmitError("No access token received from backend.");
                return;
            }

            localStorage.setItem("access_token", access_token);
            setUserData({ email, access_token });
            navigate("/");
        } catch (err) {
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
                        Sign in
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
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
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                            />
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                            }
                            label="Remember me"
                        />

                        {submitError && (
                            <Typography color="error">{submitError}</Typography>
                        )}

                        <Button type="submit" variant="contained" fullWidth>
                            Sign in
                        </Button>
                    </Box>
                </Paper>

                <Button variant="text" onClick={() => navigate("/")}>
                    ← Back to Home
                </Button>
            </Stack>
        </React.Fragment>
    );
}
