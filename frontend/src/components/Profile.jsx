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

const inputClass =
  "h-11 w-full rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] py-2.5 pl-10 pr-3 text-sm text-[rgb(var(--ink))] outline-none transition placeholder:text-[rgb(var(--mist))]/50 focus:border-[rgb(var(--iris))] focus:ring-1 focus:ring-[rgb(var(--iris))] disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "h-11 w-full rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] px-3 py-2.5 text-sm text-[rgb(var(--ink))] outline-none transition focus:border-[rgb(var(--iris))] focus:ring-1 focus:ring-[rgb(var(--iris))] disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--mist))]";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[rgb(var(--mist))]"
          />
        )}

        {children}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-[rgb(var(--iris))]">
          <Icon size={18} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[rgb(var(--ink))]">
            {title}
          </h3>

          <p className="mt-1 text-xs text-[rgb(var(--mist))]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function Profile({ onClose }) {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [editing, setEditing] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nayakProfile");

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);

      setProfile({
        ...INITIAL_PROFILE,
        ...parsed,
        specialStatus: Array.isArray(parsed.specialStatus)
          ? parsed.specialStatus
          : [],
      });

      setEditing(false);
    } catch {
      localStorage.removeItem("nayakProfile");
    }
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const updateProfile = (name, value) => {
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved(false);
  };

  const handleChange = (e) => {
    updateProfile(e.target.name, e.target.value);
  };

  const handleStateChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      state: e.target.value,
      district: "",
      city: "",
    }));

    setSaved(false);
  };

  const handleSpecialStatus = (status) => {
    setProfile((prev) => {
      const exists = prev.specialStatus.includes(status);

      return {
        ...prev,
        specialStatus: exists
          ? prev.specialStatus.filter((item) => item !== status)
          : [...prev.specialStatus, status],
      };
    });

    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("nayakProfile", JSON.stringify(profile));

    setSaved(true);
    setEditing(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setSaved(false);
  };

  const indiaStates = useMemo(
    () => State.getStatesOfCountry("IN"),
    []
  );

  const selectedState = useMemo(
    () =>
      indiaStates.find(
        (state) => state.name === profile.state
      ),
    [indiaStates, profile.state]
  );

  const cities = useMemo(() => {
    if (!selectedState) return [];

    return City.getCitiesOfState(
      "IN",
      selectedState.isoCode
    );
  }, [selectedState]);

  return (
    <>
      <style>{`
        .profile-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .profile-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .profile-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, .25);
          border-radius: 999px;
        }

        .profile-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, .45);
        }

        .profile-date::-webkit-calendar-picker-indicator {
          opacity: .7;
          cursor: pointer;
        }
      `}</style>

      {/* OVERLAY */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(10,15,30,.55)] p-3 backdrop-blur-md sm:p-5">
        {/* MODAL */}
        <div
          className="glass flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
          role="dialog"
          aria-modal="true"
        >
          {/* HEADER */}
          <header className="shrink-0 border-b border-[rgb(var(--line))]">
            <div className="flex items-center justify-between px-5 py-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-[rgb(var(--iris))]">
                  <UserRound size={21} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[rgb(var(--ink))] sm:text-xl">
                    My Profile
                  </h2>

                  <p className="mt-0.5 text-xs text-[rgb(var(--mist))] sm:text-sm">
                    Manage your personal information
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!editing && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex h-9 items-center gap-2 rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] px-3 text-xs font-medium text-[rgb(var(--mist))] transition hover:border-[rgb(var(--iris))]/40 hover:text-[rgb(var(--ink))]"
                  >
                    <Pencil size={14} />
                    <span className="hidden sm:inline">
                      Edit
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close profile"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] text-[rgb(var(--mist))] transition hover:border-[rgb(var(--iris))]/40 hover:text-[rgb(var(--ink))]"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* STATUS */}
            <div className="flex items-center gap-2 border-t border-[rgb(var(--line))] px-5 py-2.5 sm:px-7">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  editing
                    ? "bg-amber-400"
                    : "bg-[rgb(var(--jade))]"
                }`}
              />

              <span className="text-[11px] text-[rgb(var(--mist))]">
                {editing
                  ? "Editing your profile"
                  : "Your profile is up to date"}
              </span>
            </div>
          </header>

          {/* CONTENT */}
          <main className="profile-scrollbar flex-1 overflow-y-auto">
            <div className="space-y-7 p-5 sm:p-7">
              {/* PERSONAL */}
              <Section
                icon={UserRound}
                title="Personal Information"
                description="Basic information about you"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Full Name" icon={User}>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Date of Birth"
                    icon={Calendar}
                  >
                    <input
                      type="date"
                      name="dob"
                      value={profile.dob}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`${inputClass} profile-date`}
                    />
                  </Field>

                  <Field label="Age" icon={Calendar}>
                    <input
                      type="number"
                      name="age"
                      value={profile.age}
                      onChange={handleChange}
                      disabled={!editing}
                      min="1"
                      max="120"
                      placeholder="Enter your age"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Gender">
                    <select
                      name="gender"
                      value={profile.gender}
                      onChange={handleChange}
                      disabled={!editing}
                      className={selectClass}
                    >
                      <option value="">
                        Select gender
                      </option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Occupation"
                    icon={Briefcase}
                  >
                    <input
                      type="text"
                      name="occupation"
                      value={profile.occupation}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Student, Developer, Farmer..."
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <div className="h-px bg-[rgb(var(--line))]" />

              {/* LOCATION */}
              <Section
                icon={MapPinned}
                title="Location"
                description="Help Nayak provide location-specific information"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="State" icon={MapPin}>
                    <select
                      value={profile.state}
                      disabled={!editing}
                      onChange={handleStateChange}
                      className={`${selectClass} pl-10`}
                    >
                      <option value="">
                        Select state
                      </option>

                      {indiaStates.map((state) => (
                        <option
                          key={state.isoCode}
                          value={state.name}
                        >
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="District" icon={MapPin}>
                    <input
                      type="text"
                      name="district"
                      value={profile.district}
                      onChange={handleChange}
                      disabled={
                        !editing || !profile.state
                      }
                      placeholder={
                        profile.state
                          ? "Enter district"
                          : "Select state first"
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="City" icon={MapPin}>
                    <select
                      value={profile.city}
                      disabled={
                        !editing || !profile.state
                      }
                      onChange={(e) =>
                        updateProfile(
                          "city",
                          e.target.value
                        )
                      }
                      className={`${selectClass} pl-10`}
                    >
                      <option value="">
                        {profile.state
                          ? "Select city"
                          : "Select state first"}
                      </option>

                      {cities.map((city, index) => (
                        <option
                          key={`${city.name}-${index}`}
                          value={city.name}
                        >
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {profile.state && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2.5">
                    <MapPin
                      size={14}
                      className="shrink-0 text-[rgb(var(--iris))]"
                    />

                    <span className="text-[11px] text-[rgb(var(--mist))]">
                      Your location helps Nayak tailor
                      information to your area.
                    </span>
                  </div>
                )}
              </Section>

              <div className="h-px bg-[rgb(var(--line))]" />

              {/* CONTACT */}
              <Section
                icon={Mail}
                title="Contact Information"
                description="Your communication details"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Email Address"
                    icon={Mail}
                  >
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Phone Number"
                    icon={Phone}
                  >
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="+91 XXXXX XXXXX"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <div className="h-px bg-[rgb(var(--line))]" />

              {/* SOCIO-ECONOMIC */}
              <Section
                icon={Users}
                title="Socio-Economic Information"
                description="This information can help Nayak identify relevant schemes and benefits"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Approximate Annual Family Income"
                    icon={IndianRupee}
                  >
                    <select
                      name="income"
                      value={profile.income}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`${selectClass} pl-10`}
                    >
                      <option value="">
                        Select income range
                      </option>
                      <option value="Below ₹1 Lakh">
                        Below ₹1 Lakh
                      </option>
                      <option value="₹1 – ₹2.5 Lakh">
                        ₹1 – ₹2.5 Lakh
                      </option>
                      <option value="₹2.5 – ₹5 Lakh">
                        ₹2.5 – ₹5 Lakh
                      </option>
                      <option value="₹5 – ₹10 Lakh">
                        ₹5 – ₹10 Lakh
                      </option>
                      <option value="₹10 – ₹20 Lakh">
                        ₹10 – ₹20 Lakh
                      </option>
                      <option value="Above ₹20 Lakh">
                        Above ₹20 Lakh
                      </option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </Field>

                  <Field label="Social Category">
                    <select
                      name="category"
                      value={profile.category}
                      onChange={handleChange}
                      disabled={!editing}
                      className={selectClass}
                    >
                      <option value="">
                        Select category
                      </option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="OBC">OBC</option>
                      <option value="General">
                        General
                      </option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </Field>
                </div>

                {/* SPECIAL STATUS */}
                <div className="mt-5">
                  <label className={labelClass}>
                    Special Category / Status
                  </label>

                  <p className="mb-3 text-[11px] text-[rgb(var(--mist))]">
                    Select all that apply
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SPECIAL_STATUSES.map((status) => {
                      const selected =
                        profile.specialStatus.includes(
                          status
                        );

                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={!editing}
                          onClick={() =>
                            handleSpecialStatus(status)
                          }
                          className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-xs transition ${
                            selected
                              ? "border-[rgb(var(--iris))] bg-violet-500/10 text-[rgb(var(--ink))]"
                              : "border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] text-[rgb(var(--mist))] hover:border-[rgb(var(--iris))]/40 hover:text-[rgb(var(--ink))]"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              selected
                                ? "border-[rgb(var(--iris))] bg-[rgb(var(--iris))]"
                                : "border-[rgb(var(--line))] bg-transparent"
                            }`}
                          >
                            {selected && (
                              <Check
                                size={12}
                                className="text-white"
                              />
                            )}
                          </span>

                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Section>

              <div className="h-px bg-[rgb(var(--line))]" />

              {/* PREFERENCES */}
              <Section
                icon={Languages}
                title="Preferences"
                description="Customize how Nayak communicates with you"
              >
                <div className="max-w-md">
                  <Field label="Preferred Language">
                    <select
                      name="language"
                      value={profile.language}
                      onChange={handleChange}
                      disabled={!editing}
                      className={selectClass}
                    >
                      <option value="">
                        Select language
                      </option>
                      <option value="English">
                        English
                      </option>
                      <option value="Hindi">Hindi</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Marathi">
                        Marathi
                      </option>
                      <option value="Bengali">
                        Bengali
                      </option>
                    </select>
                  </Field>
                </div>
              </Section>

              {/* ABOUT */}
              <Section
                icon={User}
                title="About You"
                description="Tell Nayak a little more about yourself"
              >
                <textarea
                  name="about"
                  value={profile.about}
                  onChange={handleChange}
                  disabled={!editing}
                  rows={4}
                  placeholder="Tell Nayak something about yourself..."
                  className="w-full resize-none rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] px-3 py-3 text-sm leading-6 text-[rgb(var(--ink))] outline-none transition placeholder:text-[rgb(var(--mist))]/50 focus:border-[rgb(var(--iris))] focus:ring-1 focus:ring-[rgb(var(--iris))] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Section>

              {/* PRIVACY */}
              <div className="flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-[rgb(var(--jade))]"
                />

                <div>
                  <p className="text-xs font-medium text-[rgb(var(--ink))]">
                    Your profile stays on this device
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[rgb(var(--mist))]">
                    Your profile information is currently
                    stored locally in your browser.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* FOOTER */}
          <footer className="shrink-0 border-t border-[rgb(var(--line))] px-5 py-3 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-5">
                {saved && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--jade))]">
                    <Check size={14} />
                    Profile saved successfully
                  </span>
                )}
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] px-5 text-sm font-medium text-[rgb(var(--mist))] transition hover:border-[rgb(var(--iris))]/40 hover:bg-[rgb(var(--panel))] hover:text-[rgb(var(--ink))] sm:flex-none"
                >
                  Close
                </button>

                {editing && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="gradient-btn flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition hover:-translate-y-0.5 sm:flex-none"
                  >
                    <Check size={15} />
                    Save Profile
                  </button>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}