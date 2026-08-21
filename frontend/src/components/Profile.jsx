import { useEffect, useMemo, useState } from "react";
import {
    User,
    MapPin,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    Languages,
    X,
    Pencil,
    Check,
    UserRound,
    MapPinned,
    ShieldCheck,
    IndianRupee,
    Users,
} from "lucide-react";
import { State, City } from "country-state-city";

const INITIAL_PROFILE = {
    name: "",
    dob: "",
    age: "",
    gender: "",
    state: "",
    district: "",
    city: "",
    email: "",
    phone: "",
    occupation: "",
    income: "",
    category: "",
    specialStatus: [],
    language: "",
    about: "",
};

const SPECIAL_STATUSES = [
    "Person with disability",
    "Student",
    "Farmer",
    "Widow / Single Woman",
    "Senior Citizen",
    "Ex-Serviceman",
    "Minority",
    "Other",
];

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(10, 15, 30, .42)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },

    modal: {
        width: "min(1100px, 96vw)",
        height: "min(850px, 92vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "22px",
        /* Fully opaque */
        background: "rgb(var(--panel))",
        border: "1px solid rgb(var(--line))",
        boxShadow: "0 24px 70px rgba(0,0,0,.25)",
        color: "rgb(var(--ink))",
    },

    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid rgb(var(--line))",
        flexShrink: 0,
    },

    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    avatar: {
        width: "44px",
        height: "44px",
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        background: "linear-gradient(135deg, #6d5dfc, #20cfe5)",
    },

    title: {
        margin: 0,
        fontSize: "20px",
        fontWeight: 700,
        color: "rgb(var(--ink))",
    },

    subtitle: {
        margin: "3px 0 0",
        fontSize: "13px",
        color: "rgb(var(--mist))",
    },

    close: {
        width: "38px",
        height: "38px",
        border: "1px solid rgb(var(--line))",
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        background: "rgb(var(--panel-hi))",
        color: "rgb(var(--ink))",
        cursor: "pointer",
    },

    status: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 24px",
        fontSize: "12px",
        color: "rgb(var(--mist))",
        borderBottom: "1px solid rgb(var(--line))",
    },

    dot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "rgb(var(--iris))",
    },

    content: {
        flex: 1,
        overflowY: "auto",
        padding: "24px",
    },

    section: {
        marginBottom: "24px",
    },

    sectionTitle: {
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        marginBottom: "18px",
        color: "rgb(var(--iris))",
    },

    sectionHeading: {
        margin: 0,
        fontSize: "15px",
        fontWeight: 700,
        color: "rgb(var(--ink))",
    },

    sectionText: {
        margin: "3px 0 0",
        fontSize: "12px",
        color: "rgb(var(--mist))",
    },

    grid2: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "16px",
    },

    grid3: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "16px",
    },

    field: {
        minWidth: 0,
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontSize: "12px",
        fontWeight: 600,
        color: "rgb(var(--ink))",
    },

    inputWrap: {
        position: "relative",
    },

    input: {
        width: "100%",
        height: "44px",
        boxSizing: "border-box",
        padding: "0 12px 0 40px",
        border: "1px solid rgb(var(--line))",
        borderRadius: "10px",
        outline: "none",
        background: "rgb(var(--panel-hi))",
        color: "rgb(var(--ink))",
        fontFamily: "inherit",
        fontSize: "13px",
        opacity: 1,
        WebkitTextFillColor: "rgb(var(--ink))",
    },

    select: {
        width: "100%",
        height: "44px",
        boxSizing: "border-box",
        padding: "0 36px 0 40px",
        border: "1px solid rgb(var(--line))",
        borderRadius: "10px",
        outline: "none",
        background: "rgb(var(--panel-hi))",
        color: "rgb(var(--ink))",
        fontFamily: "inherit",
        fontSize: "13px",
        opacity: 1,
        WebkitTextFillColor: "rgb(var(--ink))",
    },

    icon: {
        position: "absolute",
        left: "12px",
        top: "13px",
        color: "rgb(var(--mist))",
        pointerEvents: "none",
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        minHeight: "110px",
        padding: "14px 14px",
        border: "1px solid rgb(var(--line))",
        borderRadius: "10px",
        outline: "none",
        resize: "vertical",
        background: "rgb(var(--panel-hi))",
        color: "rgb(var(--ink))",
        fontFamily: "inherit",
        fontSize: "13px",
        lineHeight: "1.5",
        opacity: 1,
        WebkitTextFillColor: "rgb(var(--ink))",
    },

    divider: {
        border: 0,
        borderTop: "1px solid rgb(var(--line))",
        margin: "0 0 24px",
    },

    statusLabel: {
        display: "block",
        marginBottom: "8px",
        fontSize: "12px",
        fontWeight: 600,
        color: "rgb(var(--ink))",
    },

    statusGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
    },

    statusCard: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minHeight: "44px",
        padding: "8px 10px",
        border: "1px solid rgb(var(--line))",
        borderRadius: "10px",
        background: "rgb(var(--panel))",
        color: "rgb(var(--ink))",
        fontFamily: "inherit",
        fontSize: "12px",
        textAlign: "left",
        cursor: "pointer",
    },

    check: {
        width: "18px",
        height: "18px",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        border: "1px solid rgb(var(--line))",
        borderRadius: "5px",
    },

    privacy: {
        display: "flex",
        gap: "10px",
        padding: "14px",
        border: "1px solid rgba(16,185,129,.25)",
        borderRadius: "12px",
        background: "rgba(16,185,129,.07)",
        color: "rgb(var(--ink))",
    },

    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "10px",
        padding: "14px 24px",
        borderTop: "1px solid rgb(var(--line))",
        flexShrink: 0,
    },

    closeBtn: {
        height: "40px",
        padding: "0 16px",
        border: "1px solid rgb(var(--line))",
        borderRadius: "10px",
        background: "rgb(var(--panel))",
        color: "rgb(var(--ink))",
        cursor: "pointer",
    },

    saveBtn: {
        height: "40px",
        padding: "0 16px",
        border: 0,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
    },
};

export default function Profile({ onClose }) {
    const [profile, setProfile] = useState(INITIAL_PROFILE);
    const [editing, setEditing] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("nayakProfile");

        if (!stored) return;

        try {
            const data = JSON.parse(stored);

            setProfile({
                ...INITIAL_PROFILE,
                ...data,
                specialStatus: Array.isArray(data.specialStatus)
                    ? data.specialStatus
                    : [],
            });

            setEditing(false);
        } catch {
            localStorage.removeItem("nayakProfile");
        }
    }, []);

    useEffect(() => {
        const oldOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = oldOverflow;
        };
    }, []);

    const states = useMemo(
        () => State.getStatesOfCountry("IN"),
        []
    );

    const selectedState = useMemo(
        () => states.find((s) => s.name === profile.state),
        [states, profile.state]
    );

    const cities = useMemo(() => {
        if (!selectedState) return [];

        return City.getCitiesOfState(
            "IN",
            selectedState.isoCode
        );
    }, [selectedState]);

    const update = (name, value) => {
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));

        setSaved(false);
    };

    const handleChange = (e) => {
        update(e.target.name, e.target.value);
    };

    const handleState = (e) => {
        setProfile((prev) => ({
            ...prev,
            state: e.target.value,
            district: "",
            city: "",
        }));

        setSaved(false);
    };

    const toggleStatus = (status) => {
        setProfile((prev) => ({
            ...prev,
            specialStatus: prev.specialStatus.includes(status)
                ? prev.specialStatus.filter((x) => x !== status)
                : [...prev.specialStatus, status],
        }));

        setSaved(false);
    };

    const save = () => {
        localStorage.setItem(
            "nayakProfile",
            JSON.stringify(profile)
        );

        setSaved(true);
        setEditing(false);
    };

    return (
        <div style={styles.overlay}>
            <div
                className="glass"
                style={styles.modal}
                role="dialog"
                aria-modal="true"
            >
                {/* HEADER */}
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        <div style={styles.avatar}>
                            <UserRound size={22} />
                        </div>

                        <div>
                            <h2 style={styles.title}>My Profile</h2>

                            <p style={styles.subtitle}>
                                Manage your personal information
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        {!editing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(true);
                                    setSaved(false);
                                }}
                                style={styles.closeBtn}
                            >
                                <Pencil size={15} />{" "}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.close}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* STATUS */}
                <div style={styles.status}>
                    <span style={styles.dot} />

                    {editing
                        ? "Editing your profile"
                        : "Your profile is up to date"}
                </div>

                {/* CONTENT */}
                <main
                    className="scroll-thin"
                    style={styles.content}
                >
                    <Section
                        icon={<UserRound size={18} />}
                        title="Personal Information"
                        text="Basic information about you"
                    >
                        <div style={styles.grid2}>
                            <Field
                                label="Full Name"
                                icon={<User size={17} />}
                            >
                                <input
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Enter your full name"
                                    style={styles.input}
                                />
                            </Field>

                            <Field
                                label="Date of Birth"
                                icon={<Calendar size={17} />}
                            >
                                <input
                                    type="date"
                                    name="dob"
                                    value={profile.dob}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    style={styles.input}
                                />
                            </Field>

                            <Field
                                label="Age"
                                icon={<Calendar size={17} />}
                            >
                                <input
                                    type="number"
                                    name="age"
                                    value={profile.age}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Enter age"
                                    style={styles.input}
                                />
                            </Field>

                            <Field label="Gender">
                                <select
                                    name="gender"
                                    value={profile.gender}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    style={styles.select}
                                >
                                    <option value="">Select gender</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                    <option>Prefer not to say</option>
                                </select>
                            </Field>

                            <Field
                                label="Occupation"
                                icon={<Briefcase size={17} />}
                            >
                                <input
                                    name="occupation"
                                    value={profile.occupation}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Student, Farmer..."
                                    style={styles.input}
                                />
                            </Field>
                        </div>
                    </Section>

                    <hr style={styles.divider} />

                    <Section
                        icon={<MapPinned size={18} />}
                        title="Location"
                        text="Help Nayak provide location-specific information"
                    >
                        <div style={styles.grid3}>
                            <Field
                                label="State"
                                icon={<MapPin size={17} />}
                            >
                                <select
                                    value={profile.state}
                                    onChange={handleState}
                                    disabled={!editing}
                                    style={{
                                        ...styles.input,
                                        appearance: "auto",
                                    }}
                                >
                                    <option value="">Select state</option>

                                    {states.map((state) => (
                                        <option
                                            key={state.isoCode}
                                            value={state.name}
                                        >
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="District"
                                icon={<MapPin size={17} />}
                            >
                                <input
                                    name="district"
                                    value={profile.district}
                                    onChange={handleChange}
                                    disabled={!editing || !profile.state}
                                    placeholder="Enter district"
                                    style={styles.input}
                                />
                            </Field>

                            <Field
                                label="City"
                                icon={<MapPin size={17} />}
                            >
                                <select
                                    value={profile.city}
                                    onChange={(e) =>
                                        update("city", e.target.value)
                                    }
                                    disabled={!editing || !profile.state}
                                    style={styles.select}
                                >
                                    <option value="">Select city</option>

                                    {cities.map((city, i) => (
                                        <option
                                            key={`${city.name}-${i}`}
                                            value={city.name}
                                        >
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </Section>

                    <hr style={styles.divider} />

                    <Section
                        icon={<Mail size={18} />}
                        title="Contact Information"
                        text="Your communication details"
                    >
                        <div style={styles.grid2}>
                            <Field
                                label="Email Address"
                                icon={<Mail size={17} />}
                            >
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="you@example.com"
                                    style={styles.input}
                                />
                            </Field>

                            <Field
                                label="Phone Number"
                                icon={<Phone size={17} />}
                            >
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Enter phone number"
                                    style={styles.input}
                                />
                            </Field>
                        </div>
                    </Section>

                    <hr style={styles.divider} />

                    <Section
                        icon={<Users size={18} />}
                        title="Socio-Economic Information"
                        text="Used for scheme recommendations"
                    >
                        <div style={styles.grid2}>
                            <Field
                                label="Annual Family Income"
                                icon={<IndianRupee size={17} />}
                            >
                                <select
                                    name="income"
                                    value={profile.income}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    style={styles.select}
                                >
                                    <option value="">Select income</option>
                                    <option>Below ₹1 Lakh</option>
                                    <option>₹1 – ₹2.5 Lakh</option>
                                    <option>₹2.5 – ₹5 Lakh</option>
                                    <option>₹5 – ₹10 Lakh</option>
                                    <option>₹10 – ₹20 Lakh</option>
                                    <option>Above ₹20 Lakh</option>
                                    <option>Prefer not to say</option>
                                </select>
                            </Field>

                            <Field label="Social Category">
                                <select
                                    name="category"
                                    value={profile.category}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    style={styles.select}
                                >
                                    <option value="">Select category</option>
                                    <option>SC</option>
                                    <option>ST</option>
                                    <option>OBC</option>
                                    <option>General</option>
                                    <option>Prefer not to say</option>
                                </select>
                            </Field>
                        </div>

                        <div style={{ marginTop: 18 }}>
                            <label style={styles.statusLabel}>
                                Special Category / Status
                            </label>

                            <div style={styles.statusGrid}>
                                {SPECIAL_STATUSES.map((status) => {
                                    const active =
                                        profile.specialStatus.includes(status);

                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            disabled={!editing}
                                            onClick={() => toggleStatus(status)}
                                            style={{
                                                ...styles.statusCard,
                                                borderColor: active
                                                    ? "rgb(var(--iris))"
                                                    : "rgb(var(--line))",
                                                background: active
                                                    ? "rgba(124,58,237,.10)"
                                                    : "rgb(var(--panel))",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    ...styles.check,
                                                    background: active
                                                        ? "rgb(var(--iris))"
                                                        : "transparent",
                                                    color: "#fff",
                                                }}
                                            >
                                                {active && <Check size={12} />}
                                            </span>

                                            {status}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Section>

                    <hr style={styles.divider} />

                    <Section
                        icon={<Languages size={18} />}
                        title="Preferences"
                        text="Customize how Nayak communicates with you"
                    >
                        <Field label="Preferred Language">
                            <select
                                name="language"
                                value={profile.language}
                                onChange={handleChange}
                                disabled={!editing}
                                style={styles.select}
                            >
                                <option value="">Select language</option>
                                <option>English</option>
                                <option>Hindi</option>
                                <option>Urdu</option>
                                <option>Marathi</option>
                                <option>Bengali</option>
                            </select>
                        </Field>
                    </Section>

                    <Section
                        icon={<User size={18} />}
                        title="About You"
                        text="Tell Nayak a little more about yourself"
                    >
                        <textarea
                            name="about"
                            value={profile.about}
                            onChange={handleChange}
                            disabled={!editing}
                            rows={4}
                            placeholder="Tell Nayak something about yourself..."
                            style={styles.textarea}
                        />
                    </Section>

                    <div style={styles.privacy}>
                        <ShieldCheck size={20} />

                        <div>
                            <strong style={{ fontSize: 12 }}>
                                Your profile stays on this device
                            </strong>

                            <p
                                style={{
                                    margin: "3px 0 0",
                                    fontSize: 11,
                                    color: "rgb(var(--mist))",
                                }}
                            >
                                Your profile information is stored locally
                                in your browser.
                            </p>
                        </div>
                    </div>
                </main>

                {/* FOOTER */}
                <footer style={styles.footer}>
                    {saved && (
                        <span
                            style={{
                                marginRight: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                color: "rgb(var(--jade))",
                                fontSize: 12,
                            }}
                        >
                            <Check size={15} />
                            Profile saved successfully
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        style={styles.closeBtn}
                    >
                        Close
                    </button>

                    {editing && (
                        <button
                            type="button"
                            onClick={save}
                            className="gradient-btn"
                            style={styles.saveBtn}
                        >
                            <Check size={16} />
                            Save Profile
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

function Section({ icon, title, text, children }) {
    return (
        <section style={styles.section}>
            <div style={styles.sectionTitle}>
                {icon}

                <div>
                    <h3 style={styles.sectionHeading}>{title}</h3>
                    <p style={styles.sectionText}>{text}</p>
                </div>
            </div>

            {children}
        </section>
    );
}

function Field({ label, icon, children }) {
    return (
        <div style={styles.field}>
            <label style={styles.label}>{label}</label>

            <div style={styles.inputWrap}>
                {icon && <span style={styles.icon}>{icon}</span>}
                {children}
            </div>
        </div>
    );
}