/**
 * @file Calender.jsx
 * @module Calendar
 * @date 2025-08-13
 * @description
 *   Interactive class schedule calendar allowing date selection and adding classes to cart.
 *
 * @function generateCalendar
 * @description Generates days for the current month with full weeks.
 * @returns {void}
 *
 * @function handleDayClick
 * @description Sets selected date and resets selected schedule.
 * @param {object} day - Date object and weekday string.
 *
 * @function handleAddToCart
 * @description Adds selected schedule to cart and shows snackbar confirmation.
 */

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

/**
 * Calendar.jsx — backend-only version
 * - No Supabase SDK on the client.
 * - Talks to your Express API only.
 * - Sends Authorization: Bearer <token> returned by backend /users/signin.
 *
 * Endpoints (from your backend):
 *   GET    /api/slots                  -> list all class slots
 *   GET    /api/bookings               -> list my bookings
 *   POST   /api/bookings               -> { slot_id, class_date }
 *   DELETE /api/bookings/:id           -> cancel
 */

const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

// Change this if your API is mounted elsewhere
const API_BASE = "http://localhost:5000/api";

const normalizeDay = (s) => {
    if (!s) return "";
    const map = {
        sun: "Sunday",
        sunday: "Sunday",
        mon: "Monday",
        monday: "Monday",
        tue: "Tuesday",
        tues: "Tuesday",
        tuesday: "Tuesday",
        wed: "Wednesday",
        weds: "Wednesday",
        wednesday: "Wednesday",
        thu: "Thursday",
        thur: "Thursday",
        thurs: "Thursday",
        thursday: "Thursday",
        fri: "Friday",
        friday: "Friday",
        sat: "Saturday",
        saturday: "Saturday",
    };
    const k = String(s).trim().toLowerCase();
    return map[k] ?? (WEEKDAYS.map((w) => w.toLowerCase()).includes(k)
        ? k.charAt(0).toUpperCase() + k.slice(1)
        : String(s));
};

export default function Calendar() {
    // Expect your UserContext to expose an access token your backend gave you
    // when the user signed in (UserController.signIn returns access_token).
    const { userData, accessToken } = (typeof useUser === "function" ? useUser() : {}) || {};
    const token = accessToken || localStorage.getItem("access_token") || null;

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [calendarDays, setCalendarDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    const [slotsByWeekday, setSlotsByWeekday] = useState({});
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [totalSlots, setTotalSlots] = useState(0);

    const [bookings, setBookings] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: "", color: "#4caf50" });

    // Build calendar grid
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

    console.log("API_BASE", API_BASE, "page origin", window.location.origin);

    // Axios instance with auth header
    const api = axios.create({ baseURL: API_BASE });
    api.interceptors.request.use((config) => {
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    // Load class slots (robust to different field names)
    useEffect(() => {
        const getField = (obj, names, fallback = undefined) => {
            for (const n of names) if (obj && obj[n] !== undefined && obj[n] !== null) return obj[n];
            return fallback;
        };

        const loadSlots = async () => {
            setLoadingSlots(true);
            try {
                const { data } = await api.get("/slots");
                console.log("/slots →", Array.isArray(data) ? data.length : data, data?.[0]);

                const normalized = (Array.isArray(data) ? data : []).map((s) => ({
                    id: getField(s, ["id", "slot_id", "slotId"]),
                    day_of_week: normalizeDay(
                        getField(s, ["day_of_week", "dayOfWeek", "weekday", "day", "dow", "dayname", "dayName", "Day"], "")
                    ),
                    group_type: getField(s, ["group_type", "groupType", "group", "category", "type"], ""),
                    start_time: getField(s, ["start_time", "startTime", "start", "from", "begin"], ""),
                    end_time:   getField(s, ["end_time", "endTime", "end", "to", "finish"], ""),
                    price_cents: Number(getField(s, ["price_cents", "priceCents", "price", "cost_cents", "cost"], 0)) || 0,
                    capacity:   Number(getField(s, ["capacity", "cap", "max"], 0)) || 0,
                }));

                const grouped = {};
                for (const s of normalized) {
                    const key = s.day_of_week || "(unknown)";
                    (grouped[key] = grouped[key] || []).push(s);
                }
                for (const k of Object.keys(grouped)) {
                    grouped[k].sort((a, b) =>
                        String(a.start_time || "").localeCompare(String(b.start_time || ""))
                    );
                }

                setSlotsByWeekday(grouped);
                setTotalSlots(Object.values(grouped).reduce((n, arr) => n + arr.length, 0));

                // auto-select a day that has slots
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, calendarDays.length]);

    // Load my bookings
    useEffect(() => {
        if (!token) return; // must be signed in to hit protected route
        const loadBookings = async () => {
            setLoadingBookings(true);
            try {
                const { data } = await api.get("/bookings");
                const normalized = (data ?? []).map((b) => ({
                    id: b.id,
                    slotId: b.slotId ?? b.slot_id,
                    classDate: b.classDate ?? b.class_date,
                    bookedAt: b.bookedAt ?? b.booked_at,
                    status: b.status,
                    dayOfWeek: normalizeDay(b.dayOfWeek ?? b.day_of_week ?? b.class_slots?.day_of_week),
                    groupType: b.groupType ?? b.group_type ?? b.class_slots?.group_type,
                    startTime: b.startTime ?? b.start_time ?? b.class_slots?.start_time,
                    endTime: b.endTime ?? b.end_time ?? b.class_slots?.end_time,
                    priceCents: b.priceCents ?? b.price_cents ?? b.class_slots?.price_cents,
                    capacity: b.capacity ?? b.class_slots?.capacity,
                }));
                setBookings(normalized);
            } catch (e) {
                setSnack({ open: true, message: `Failed to load bookings: ${e.response?.data?.error || e.message}`, color: "#f44336" });
            } finally {
                setLoadingBookings(false);
            }
        };
        loadBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const slotsForSelectedDay = useMemo(() => {
        if (!selectedDate) return [];
        return slotsByWeekday[selectedDate.dayOfWeek] || [];
    }, [selectedDate, slotsByWeekday]);

// Auto-select the first in-month day that actually has slots once both
// the calendar grid and the slots map are available
    useEffect(() => {
        if (selectedDate || !calendarDays.length) return;
        for (const d of calendarDays) {
            const count = (slotsByWeekday[d.dayOfWeek] || []).length;
            if (d.inMonth && count > 0) {
                setSelectedDate(d);
                setSelectedSlotId(slotsByWeekday[d.dayOfWeek][0]?.id ?? null);
                break;
            }
        }
    }, [calendarDays, slotsByWeekday, selectedDate]);

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

    const bookSelected = async () => {
        if (!token) {
            setSnack({ open: true, message: "Please sign in to book.", color: "#f44336" });
            return;
        }
        if (!selectedDate || !selectedSlotId) return;

        const d = selectedDate.date;
        const class_date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
            .toISOString()
            .slice(0, 10);

        try {
            const { data } = await api.post("/bookings", { slot_id: selectedSlotId, class_date });
            setBookings((prev) => [
                ...prev,
                {
                    id: data.id,
                    slotId: data.slotId ?? data.slot_id ?? selectedSlotId,
                    classDate: data.classDate ?? data.class_date ?? class_date,
                    bookedAt: data.bookedAt ?? data.booked_at,
                    status: data.status ?? "booked",
                    dayOfWeek: normalizeDay(data.dayOfWeek ?? data.day_of_week ?? data.class_slots?.day_of_week),
                    groupType: data.groupType ?? data.group_type ?? data.class_slots?.group_type,
                    startTime: data.startTime ?? data.start_time ?? data.class_slots?.start_time,
                    endTime: data.endTime ?? data.end_time ?? data.class_slots?.end_time,
                    priceCents: data.priceCents ?? data.price_cents ?? data.class_slots?.price_cents,
                    capacity: data.capacity ?? data.class_slots?.capacity,
                },
            ]);
            setSnack({ open: true, message: "Class booked!", color: "#4caf50" });
        } catch (e) {
            setSnack({ open: true, message: `Booking failed: ${e.response?.data?.error || e.message}`, color: "#f44336" });
        }
    };

    const cancelBooking = async (bookingId) => {
        try {
            await api.delete(`/bookings/${bookingId}`);
            setBookings((prev) => prev.filter((b) => b.id !== bookingId));
            setSnack({ open: true, message: "Booking canceled.", color: "#4caf50" });
        } catch (e) {
            setSnack({ open: true, message: `Cancel failed: ${e.response?.data?.error || e.message}`, color: "#f44336" });
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Class Calendar
            </Typography>

            <Grid container spacing={2}>
                {/* Calendar */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Button onClick={() => handleMonthChange("prev")}>
                                ◀
                            </Button>
                            <Typography variant="h6">
                                {new Date(currentYear, currentMonth).toLocaleString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </Typography>
                            <Button onClick={() => handleMonthChange("next")}>
                                ▶
                            </Button>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mt: 2 }}>
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                <Typography key={d} align="center" variant="body1" sx={{ fontWeight: 600 }}>
                                    {d}
                                </Typography>
                            ))}
                            {calendarDays.map((day, idx) => (
                                <Button
                                    key={idx}
                                    variant={selectedDate?.date.getTime() === day.date.getTime() ? "contained" : "outlined"}
                                    onClick={() => handleDayClick(day)}
                                    disabled={!day.inMonth}
                                    sx={{
                                        opacity: day.inMonth ? 1 : 0.35,
                                        bgcolor: day.date.toDateString() === new Date().toDateString() ? "action.selected" : undefined,
                                    }}
                                >
                                    {day.date.getDate()}
                                </Button>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Day's Slots + Book */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">
                            Selected: {selectedDate ? selectedDate.date.toDateString() : "None"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                            {loadingSlots
                                ? "Loading class slots…"
                                : `Slots loaded: ${totalSlots}${
                                    selectedDate ? ` • For ${selectedDate.dayOfWeek}: ${slotsForSelectedDay?.length ?? 0}` : ""
                                }`}
                        </Typography>

                        {/* Debug summary of counts per weekday (remove after confirming) */}
                        <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption">Per-weekday counts:</Typography>
                            <pre style={{ margin: 0, fontSize: 11 }}>
    {JSON.stringify(
        Object.fromEntries(
            Object.keys(slotsByWeekday).sort().map(k => [k, (slotsByWeekday[k]||[]).length])
        ),
        null,
        2
    )}
  </pre>

                            <Typography variant="caption">Sample raw rows:</Typography>
                            <pre style={{ margin: 0, fontSize: 11, maxHeight: 160, overflow: "auto" }}>
    {(() => {
        const buckets = Object.values(slotsByWeekday);
        const any = buckets.length ? buckets[0] : [];
        return JSON.stringify(any.slice(0,2), null, 2);
    })()}
  </pre>
                        </Box>

                        {selectedDate ? (
                            (slotsForSelectedDay?.length ?? 0) > 0 ? (
                                <Table size="small">
                                    <TableBody>
                                        {slotsForSelectedDay.map((slot) => (
                                            <TableRow key={slot.id}>
                                                <TableCell sx={{ whiteSpace: "nowrap" }}>{slot.group_type}</TableCell>
                                                <TableCell sx={{ whiteSpace: "nowrap" }}>{slot.start_time}–{slot.end_time}</TableCell>
                                                <TableCell>${((slot.price_cents || 0) / 100).toFixed(2)}</TableCell>
                                                <TableCell align="right">
                                                    <Radio checked={selectedSlotId === slot.id} onChange={() => setSelectedSlotId(slot.id)} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Box sx={{ mt: 1 }}>
                                    <Typography>No slots were returned for {selectedDate.dayOfWeek}.</Typography>
                                    {/* Suggest other days that do have slots */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {WEEKDAYS.filter(d => (slotsByWeekday[d]||[]).length > 0).map(d => (
                                            <Button key={d} size="small" variant="outlined" onClick={() => {
                                                const target = calendarDays.find(cd => cd.inMonth && cd.dayOfWeek === d);
                                                if (target) {
                                                    setSelectedDate(target);
                                                    setSelectedSlotId(slotsByWeekday[d][0]?.id ?? null);
                                                }
                                            }}>
                                                {d} ({(slotsByWeekday[d]||[]).length})
                                            </Button>
                                        ))}
                                    </Box>
                                    {/* Raw data for this weekday (debug) */}
                                    <pre style={{ fontSize: 12, opacity: 0.7, maxHeight: 160, overflow: 'auto' }}>
            {JSON.stringify(slotsByWeekday[selectedDate.dayOfWeek] ?? [], null, 2)}
          </pre>
                                </Box>
                            )
                        ) : (
                            <Typography sx={{ mt: 1 }}>Pick a date to see available classes.</Typography>
                        )}

                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={bookSelected} disabled={!selectedDate || !selectedSlotId}>
                                Book class
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* My Bookings */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="h6">My Bookings</Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {loadingBookings ? "Loading…" : ""}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {bookings.length ? (
                            <Table size="small">
                                <TableBody>
                                    {bookings.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{b.classDate}</TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{b.groupType ?? "—"}</TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                {b.startTime && b.endTime ? `${b.startTime}–${b.endTime}` : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {typeof b.priceCents === "number" ? `$${(b.priceCents / 100).toFixed(2)}` : "—"}
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: "nowrap" }}>{b.status ?? "booked"}</TableCell>
                                            <TableCell align="right">
                                                <Button size="small" onClick={() => cancelBooking(b.id)}>
                                                    Cancel
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Typography>No bookings yet.</Typography>
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
