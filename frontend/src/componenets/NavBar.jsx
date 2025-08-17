//NavBar.js
import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Link as MuiLink } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useData } from './UserContext';

const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Calendar', to: '/calendar' },
    { label: 'Cart', to: '/cart' },
];

export default function NavBar() {
    const [user, setUser] = useState(null);
    const { setUserData } = useData();
    const navigate = useNavigate();

    // Keep React state + sessionStorage in sync with Supabase
    useEffect(() => {
        const loadUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            handleUserChange(session?.user || null);
        };
        const { subscription } = supabase.auth.onAuthStateChange(
            (_event, session) => handleUserChange(session?.user || null)
        ).data;

        loadUser();
        return () => subscription.unsubscribe();
    }, []);

    const handleUserChange = (user) => {
        if (user) {
            setUser(user);
            setUserData(user);
            sessionStorage.setItem('user', JSON.stringify(user));
        } else {
            setUser(null);
            setUserData(null);
            sessionStorage.removeItem('user');
        }
    };

    // Enhanced sign-out: fire-and-forget + immediate UI reset/redirect
    const handleSignOut = async () => {
        console.log('handleSignOut');

        // 1) Try to clear on the server+client…
        supabase.auth.signOut()
            .then(({ error }) => {
                if (error) console.error('Server sign-out error:', error.message);
                else console.log('Server sign-out succeeded');
            })
            .catch((err) => console.error('Unexpected sign-out error:', err));

        // 2) Immediately clear your React state + sessionStorage
        handleUserChange(null);

        // 3) Wipe Supabase tokens in localStorage so reload can't bring you back
        Object.keys(localStorage)
            .filter(key => key.startsWith('sb-'))
            .forEach(key => localStorage.removeItem(key));

        // 4) Redirect
        navigate('/signin', { replace: true });
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                    {navLinks.map(({ label, to }) => (
                        <MuiLink
                            key={to}
                            component={RouterLink}
                            to={to}
                            color="inherit"
                            underline="none"
                        >
                            {label}
                        </MuiLink>
                    ))}
                </Box>

                {user ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography>
                            Welcome, {
                            user.user_metadata?.full_name
                            ?? user.user_metadata?.display_name
                            ?? user.email
                        }
                        </Typography>
                        <Button color="inherit" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button component={RouterLink} to="/signin" color="inherit">
                            Sign In
                        </Button>
                        <Button component={RouterLink} to="/signup" color="inherit">
                            Sign Up
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}