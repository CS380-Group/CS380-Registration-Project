/*
 * @file Calender.jsx
 * @module Calendar
 * @date 2025-08-13
 * @description
 *   Interactive class schedule calendar allowing date selection and adding classes to cart.
 *
 * @function //generateCalendar
 * @description Generates days for the current month with full weeks.
 * @returns {void}
 *
 * @function //handleDayClick
 * @description Sets selected date and resets selected schedule.
 * @param //{object} day - Date object and weekday string.
 *
 * @function //handleAddToCart
 * @description Adds selected schedule to cart and shows snackbar confirmation.
 */

// Updated Calendar.jsx — full rewrite with all applied fixes

import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Radio,
    Snackbar,
    SnackbarContent,
    Divider,
} from "@mui/material";
import axios from "axios";
import { useUser } from "../contexts/UserContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api";

const normalizeDay = (s) => {
    if (!s) return "";
    const map = {
        sun: "Sunday", sunday: "Sunday",
        mon: "Monday", monday: "Monday",
        tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
        wed: "Wednesday", weds: "Wednesday", wednesday: "Wednesday",
        thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
        fri: "Friday", friday: "Friday",
        sat: "Saturday", saturday: "Saturday"
    };
    const k = String(s).trim().toLowerCase();
    return map[k] ?? (WEEKDAYS.map(w => w.toLowerCase()).includes(k) ? k.charAt(0).toUpperCase() + k.slice(1) : String(s));
};

export default function Calendar() {
    const { userData, accessToken } = (typeof useUser === "function" ? useUser() : {}) || {};
    const token = accessToken || localStorage.getItem("access_token") || null;
    const { cart, addToCart, removeFromCart } = useCart();

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [calendarDays, setCalendarDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [slotsByWeekday, setSlotsByWeekday] = useState({});
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [totalSlots, setTotalSlots] = useState(0);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingCart, setLoadingCart] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: "", color: "#4caf50" });

    useEffect(() => {
        const first = new Date(currentYear, currentMonth, 1);
        const startDow = first.getDay();
        const last = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = last.getDate();
        const totalCells = Math.ceil((startDow + totalDays) / 7) * 7;
        const days = [];
        for (let i = 0; i < totalCells; i++) {
            const date = new Date(currentYear, currentMonth, i + 1 - startDow);
            const dayOfWeek = WEEKDAYS[date.getDay()];
            days.push({ date, dayOfWeek, inMonth: date.getMonth() === currentMonth });
        }
        setCalendarDays(days);
    }, [currentMonth, currentYear]);

    const api = axios.create({ baseURL: API_BASE });
    api.interceptors.request.use((config) => {
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    useEffect(() => {
        const getField = (obj, names, fallback = undefined) => {
            for (const n of names) if (obj && obj[n] !== undefined && obj[n] !== null) return obj[n];
            return fallback;
        };
        const loadSlots = async () => {
            setLoadingSlots(true);
            try {
                const { data } = await api.get("/slots");
                const normalized = (Array.isArray(data) ? data : []).map((s) => ({
                    id: getField(s, ["id", "slot_id", "slotId"]),
                    day_of_week: normalizeDay(getField(s, ["day_of_week", "dayOfWeek", "weekday"], "")),
                    group_type: getField(s, ["group_type", "groupType"], ""),
                    start_time: getField(s, ["start_time", "startTime"], ""),
                    end_time: getField(s, ["end_time", "endTime"], ""),
                    price_cents: Number(getField(s, ["price_cents", "price"], 0)) || 0,
                    capacity: Number(getField(s, ["capacity"], 0)) || 0,
                }));
                const grouped = {};
                for (const s of normalized) {
                    const key = s.day_of_week || "(unknown)";
                    (grouped[key] = grouped[key] || []).push(s);
                }
                for (const k of Object.keys(grouped)) {
                    grouped[k].sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")));
                }
                setSlotsByWeekday(grouped);
                setTotalSlots(Object.values(grouped).reduce((n, arr) => n + arr.length, 0));
                if (!selectedDate && calendarDays.length) {
                    const firstHit = calendarDays.find(d => d.inMonth && (grouped[d.dayOfWeek]?.length > 0));
                    if (firstHit) {
                        setSelectedDate(firstHit);
                        setSelectedSlotId(grouped[firstHit.dayOfWeek][0]?.id ?? null);
                    }
                }
            } catch (e) {
                setSnack({ open: true, message: `Failed to load class slots: ${e.response?.data?.error || e.message}`, color: "#f44336" });
            } finally {
                setLoadingSlots(false);
            }
        };
        loadSlots();
    }, [token, calendarDays.length]);

    const slotsForSelectedDay = useMemo(() => {
        if (!selectedDate) return [];
        return slotsByWeekday[selectedDate.dayOfWeek] || [];
    }, [selectedDate, slotsByWeekday]);

    const handleDayClick = (day) => {
        setSelectedDate(day);
        const slots = slotsByWeekday[day.dayOfWeek] || [];
        setSelectedSlotId(slots.length ? slots[0].id : null);
    };

    const handleMonthChange = (dir) => {
        if (dir === "prev") {
            if (currentMonth === 0) {
                setCurrentYear((y) => y - 1);
                setCurrentMonth(11);
            } else setCurrentMonth((m) => m - 1);
        } else {
            if (currentMonth === 11) {
                setCurrentYear((y) => y + 1);
                setCurrentMonth(0);
            } else setCurrentMonth((m) => m + 1);
        }
    };

    const addToCartHandler = async () => {
        if (!token) {
            setSnack({ open: true, message: "Please sign in to add to cart.", color: "#f44336" });
            return;
        }

        if (!selectedDate || !selectedSlotId) return;

        const d = selectedDate.date;
        const class_date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
            .toISOString()
            .slice(0, 10);

        try {
            await addToCart({ slot_id: selectedSlotId, class_date });  // ← safe to call
            setSnack({ open: true, message: "Class added to cart!", color: "#4caf50" });
        } catch (e) {
            setSnack({ open: true, message: "Add to cart failed", color: "#f44336" });
        }
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom component="h1">Class Calendar</Typography>

            <Grid container spacing={2}>
                <Grid xs={12} md={7}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Button onClick={() => handleMonthChange("prev")}>◀</Button>
                            <Typography variant="h6">
                                {new Date(currentYear, currentMonth).toLocaleString("en-US", { month: "long", year: "numeric" })}
                            </Typography>
                            <Button onClick={() => handleMonthChange("next")}>▶</Button>
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mt: 2 }}>
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                <Typography key={d} align="center" variant="body1" sx={{ fontWeight: 600 }}>{d}</Typography>
                            ))}
                            {calendarDays.map((day, idx) => (
                                <Button
                                    key={idx}
                                    variant={selectedDate?.date.getTime() === day.date.getTime() ? "contained" : "outlined"}
                                    onClick={() => handleDayClick(day)}
                                    disabled={!day.inMonth}
                                    sx={{ opacity: day.inMonth ? 1 : 0.35 }}
                                >
                                    {day.date.getDate()}
                                </Button>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                <Grid xs={12} md={5}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" component="h2">
                            Selected: {selectedDate ? selectedDate.date.toDateString() : "None"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                            {loadingSlots ? "Loading class slots…" : `Slots loaded: ${totalSlots} • For ${selectedDate?.dayOfWeek ?? ""}: ${slotsForSelectedDay.length}`}
                        </Typography>
                        {selectedDate && slotsForSelectedDay.length > 0 ? (
                            <Table size="small">
                                <TableBody>
                                    {slotsForSelectedDay.map((slot) => (
                                        <TableRow key={slot.id}>
                                            <TableCell>{slot.group_type}</TableCell>
                                            <TableCell>{slot.start_time}–{slot.end_time}</TableCell>
                                            <TableCell>${(slot.price_cents / 100).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                <Radio checked={selectedSlotId === slot.id} onChange={() => setSelectedSlotId(slot.id)} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Typography sx={{ mt: 1 }}>No slots for this day.</Typography>
                        )}
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={addToCartHandler} disabled={!selectedDate || !selectedSlotId}>
                                Add to Cart
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* My Cart */}
                <Grid xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="h6" component="h2">My Cart</Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {loadingCart ? "Loading…" : ""}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {cart.length ? (
                            <Table size="small">
                                <TableBody>

                                    {console.log("Cart contents:", cart)}

                                    {cart.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.group_type || "—"}</TableCell>
                                            <TableCell>
                                                {(item.start_time && item.end_time)
                                                    ? `${item.start_time}–${item.end_time}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {typeof item.price_cents === "number"
                                                    ? `$${(item.price_cents / 100).toFixed(2)}`
                                                    : "—"}
                                            </TableCell>

                                            <TableCell align="right">
                                                <Button size="small" onClick={() => removeFromCart(item.id)}>Remove</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Typography>No items in cart yet.</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
            >
                <SnackbarContent sx={{ backgroundColor: snack.color, color: "#fff" }} message={snack.message} />
            </Snackbar>
        </Box>
    );
}
