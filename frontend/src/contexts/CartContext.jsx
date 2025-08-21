/**
 * @file CartContext.jsx
 * @module CartContext
 * @date 2025-08-13
 * @description
 *   Provides global cart state management using React Context API.
 *
 * @function addToCart
 * @description Adds an item to cart via API and updates local state.
 *
 * @function removeFromCart
 * @description Removes an item by ID from cart via API.
 */

/**
 * CartContext: safe defaults + hook
 */

// frontend/src/contexts/CartContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const baseURL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const getAccessToken = () => localStorage.getItem("access_token");

const axiosWithAuth = axios.create({ baseURL });
axiosWithAuth.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const normalizeCartItems = (items) =>
    items.map((item) => ({
        id: item.id,
        slot_id: item.slotId,
        class_date: item.classDate,
        added_at: item.addedAt,
        group_type: item.groupType ?? "—",
        start_time: item.startTime ?? "—",
        end_time: item.endTime ?? "—",
        price_cents: item.priceCents ?? null,
        capacity: item.capacity ?? null,
    }));

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    const loadCart = async () => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const res = await axiosWithAuth.get(`/api/cart`);
            if (Array.isArray(res.data)) {
                setCart(normalizeCartItems(res.data));
            }
        } catch (e) {
            console.error("Failed to load cart:", e);
        }
    };

    const addToCart = async (item) => {
        const token = getAccessToken();
        if (!token) return;

        try {
            await axiosWithAuth.post(`/api/cart`, item);
            await loadCart(); // refresh cart after add
        } catch (e) {
            console.error("addToCart failed:", e);
        }
    };

    const removeFromCart = async (id) => {
        const token = getAccessToken();
        if (!token) return;

        try {
            await axiosWithAuth.delete(`/api/cart/${id}`);
            await loadCart(); // refresh cart after delete
        } catch (e) {
            console.error("removeFromCart failed:", e);
        }
    };

    useEffect(() => {
        loadCart(); // initial cart load on mount
    }, []);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
};
