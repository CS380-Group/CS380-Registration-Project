/**
 * @file Cart.jsx
 * @module Cart
 * @date 2025-08-13
 * @author Talin
 * @description
 *   Displays shopping cart items, allows removal, clearing, and navigation to checkout.
 *
 * @component
 * @example
 * return <Cart />;
 *
 * @function removeFromCart
 * @description Removes an item by ID from the cart.
 * @param {string|number} itemId - Unique item identifier.
 * @returns {void}
 *
 * @function clearCart
 * @description Empties the cart of all items.
 * @returns {void}
 */





// src/components/Cart.jsx
// frontend/src/components/Cart.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// ✅ Deep MUI imports (keep consistent with your working SignIn style)
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

// If your CartContext exports useCart(), this import is correct;
// otherwise change to: import { CartContext } from "../contexts/CartContext.jsx" and use useContext.
import { useCart } from "../contexts/CartContext.jsx";

export default function Cart() {
    const navigate = useNavigate();
    const ctx = typeof useCart === "function" ? useCart() : {};
    const {
        cart: rawCart,
        removeFromCart: remove = () => {},
        clearCart: clear = () => {},
    } = ctx || {};

    const cart = Array.isArray(rawCart) ? rawCart : [];

    const hasItems = cart.length > 0;

    return (
        <Stack alignItems="center" sx={{ minHeight: "100vh", py: 6 }}>
            <Paper elevation={2} sx={{ width: "100%", maxWidth: 720, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Your Cart
                </Typography>

                {hasItems ? (
                    <Table>
                        <TableBody>
                            {cart.map((item, idx) => {
                                const key = item?.id ?? idx; // fallback key if no id
                                const group = item?.group_type ?? "—";
                                const time = item?.start_time && item?.end_time ? `${item.start_time}–${item.end_time}` : "—";
                                const cost = typeof item?.price_cents === "number" ? (item.price_cents / 100).toFixed(2) : "—";

                                return (
                                    <TableRow key={key}>
                                        <TableCell>{group}</TableCell>
                                        <TableCell>{time}</TableCell>
                                        <TableCell>${cost}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => remove(item?.id ?? key)}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <Typography sx={{ my: 2 }}>No items in cart.</Typography>
                )}

                <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                    <Button variant="contained" onClick={clear} disabled={!hasItems}>
                        Clear Cart
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate("/checkout")}
                        disabled={!hasItems}
                    >
                        Checkout
                    </Button>
                </Box>
            </Paper>
        </Stack>
    );
}
