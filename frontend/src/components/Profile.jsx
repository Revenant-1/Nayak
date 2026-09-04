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

const inputClass =
  "w-full rounded-xl border border-line bg-panel-hi py-3 pl-11 pr-3 text-sm text-ink placeholder:text-mist outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/15 disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "w-full rounded-xl border border-line bg-panel-hi px-3 py-3 text-sm text-ink outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/15 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-mist";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist"
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
          <Icon size={19} className="text-cyan" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-ink">
            {title}
          </h3>

          <p className="mt-0.5 text-xs leading-5 text-mist">
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

  /* Load saved profile */
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
    localStorage.setItem(
      "nayakProfile",
      JSON.stringify(profile)
    );

    setSaved(true);
    setEditing(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setSaved(false);
  };

  /* India states */
  const indiaStates = useMemo(
    () => State.getStatesOfCountry("IN"),
    []
  );

  /* Selected state */
  const selectedState = useMemo(
    () =>
      indiaStates.find(
        (state) => state.name === profile.state
      ),
    [indiaStates, profile.state]
  );

  /* Cities of selected state */
  const cities = useMemo(() => {
    if (!selectedState) return [];

    return City.getCitiesOfState(
      "IN",
      selectedState.isoCode
    );
  }, [selectedState]);

  const specialStatuses = [
    "Person with disability",
    "Student",
    "Farmer",
    "Widow / Single Woman",
    "Senior Citizen",
    "Ex-Serviceman",
    "Minority",
    "Other",
  ];

  return (
    <>
      <style>{`
        .date-input::-webkit-calendar-picker-indicator {
          filter: none;
          opacity: .8;
          cursor: pointer;
        }

        html.dark .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(1.5);
        }

        .profile-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .profile-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .profile-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, .25);
          border-radius: 999px;
        }

        .profile-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, .45);
        }
      `}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-5">

        {/* Modal */}
        <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-cyan/30 bg-panel text-ink shadow-[0_25px_80px_rgba(6,80,75,.28),0_0_45px_rgba(37,99,235,.08)]">

          {/* ================= HEADER ================= */}
          <header className="shrink-0 border-b border-line/60 bg-panel-hi shadow-[0_4px_20px_rgba(20,184,166,.04)]">

            <div className="flex items-center justify-between px-5 py-4 sm:px-7">

              <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan/30 bg-cyan/10">
                  <UserRound
                    size={23}
                    className="text-cyan"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-ink sm:text-xl">
                    My Profile
                  </h2>

                  <p className="text-xs text-mist sm:text-sm">
                    Manage your personal information
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">

                {!editing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 rounded-xl border border-cyan/25 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition hover:bg-cyan/20 sm:px-4 sm:text-sm"
                  >
                    <Pencil size={15} />

                    <span className="hidden sm:inline">
                      Edit
                    </span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  aria-label="Close profile"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-mist transition hover:bg-cyan/5 hover:text-ink"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-line/60 px-5 py-2.5 sm:px-7">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  editing
                    ? "bg-amber-400"
                    : "bg-jade"
                }`}
              />

              <span className="text-xs text-mist">
                {editing
                  ? "Editing your profile"
                  : "Your profile is up to date"}
              </span>
            </div>
          </header>

          {/* ================= CONTENT ================= */}
          <main className="profile-scrollbar flex-1 overflow-y-auto">

            <div className="space-y-8 p-5 sm:p-7">

              {/* ================= PERSONAL ================= */}
              <Section
                icon={UserRound}
                title="Personal Information"
                description="Basic information about you"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Full Name */}
                  <Field
                    label="Full Name"
                    icon={User}
                  >
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

                  {/* Date of Birth */}
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
                      className={`${inputClass} date-input`}
                    />
                  </Field>

                  {/* Age */}
                  <Field
                    label="Age"
                    icon={Calendar}
                  >
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

                  {/* Gender */}
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

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>

                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </Field>

                  {/* Occupation */}
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
                      placeholder="Student, Developer, Farmer, etc."
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <div className="h-px bg-line/50" />

              {/* ================= LOCATION ================= */}
              <Section
                icon={MapPinned}
                title="Location"
                description="Help Nayak provide location-specific information"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                  {/* State */}
                  <Field
                    label="State"
                    icon={MapPin}
                  >
                    <select
                      value={profile.state}
                      disabled={!editing}
                      onChange={handleStateChange}
                      className={`${selectClass} pl-11`}
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

                  {/* District */}
                  <Field
                    label="District"
                    icon={MapPin}
                  >
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

                  {/* City */}
                  <Field
                    label="City"
                    icon={MapPin}
                  >
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
                      className={`${selectClass} pl-11`}
                    >
                      <option value="">
                        {profile.state
                          ? "Select city"
                          : "Select state first"}
                      </option>

                      {cities.map((city) => (
                        <option
                          key={`${city.name}-${city.stateCode}`}
                          value={city.name}
                        >
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {profile.state && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue/20 bg-blue/5 px-3 py-2.5">
                    <MapPin
                      size={15}
                      className="text-cyan"
                    />

                    <span className="text-xs text-mist">
                      Your location helps Nayak tailor
                      information to your area.
                    </span>
                  </div>
                )}
              </Section>

              <div className="h-px bg-line/50" />

              {/* ================= CONTACT ================= */}
              <Section
                icon={Mail}
                title="Contact Information"
                description="Your communication details"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Email */}
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

                  {/* Phone */}
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

              <div className="h-px bg-line/50" />

              {/* ================= SOCIO ECONOMIC ================= */}
              <Section
                icon={Users}
                title="Socio-Economic Information"
                description="This information can help Nayak identify relevant schemes and benefits"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Annual Family Income */}
                  <Field
                    label="Approximate Annual Family Income"
                    icon={IndianRupee}
                  >
                    <select
                      name="income"
                      value={profile.income}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`${selectClass} pl-11`}
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

                  {/* Social Category */}
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

                      <option value="SC">
                        SC
                      </option>

                      <option value="ST">
                        ST
                      </option>

                      <option value="OBC">
                        OBC
                      </option>

                      <option value="General">
                        General
                      </option>

                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </Field>
                </div>

                {/* Special Status */}
                <div className="mt-6">
                  <label className={labelClass}>
                    Special Category / Status
                  </label>

                  <p className="mb-3 text-xs text-mist">
                    Select all that apply
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                    {specialStatuses.map((status) => {
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
                          className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                            selected
                              ? "border-cyan/50 bg-cyan/10 text-ink"
                              : "border-line bg-panel-hi text-mist hover:border-cyan/30 hover:bg-cyan/5"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              selected
                                ? "border-cyan bg-cyan"
                                : "border-line bg-transparent"
                            }`}
                          >
                            {selected && (
                              <Check
                                size={13}
                                className="text-ink"
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

              <div className="h-px bg-line/50" />

              {/* ================= PREFERENCES ================= */}
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

                      <option value="Hindi">
                        Hindi
                      </option>

                      <option value="Urdu">
                        Urdu
                      </option>

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

              {/* ================= ABOUT ================= */}
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
                  className="w-full resize-none rounded-xl border border-line bg-panel-hi px-4 py-3 text-sm leading-6 text-ink placeholder:text-mist outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Section>

              {/* ================= PRIVACY ================= */}
              <div className="flex gap-3 rounded-2xl border border-jade/20 bg-jade/5 p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-jade"
                />

                <div>
                  <p className="text-sm font-medium text-jade">
                    Your profile stays on this device
                  </p>

                  <p className="mt-1 text-xs leading-5 text-mist">
                    Your profile information is currently
                    stored locally in your browser.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* ================= FOOTER ================= */}
          <footer className="shrink-0 border-t border-line/60 bg-panel-hi px-5 py-4 sm:px-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-h-5">
                {saved && (
                  <span className="flex items-center gap-2 text-xs font-medium text-jade">
                    <Check size={15} />
                    Profile saved successfully
                  </span>
                )}
              </div>

              <div className="flex w-full gap-3 sm:w-auto">

                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-line bg-panel-hi px-5 py-2.5 text-sm font-medium text-mist transition hover:border-cyan/30 hover:bg-cyan/5 hover:text-ink sm:flex-none"
                >
                  Close
                </button>

                {editing && (
                  <button
                    onClick={handleSave}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-ink transition hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 hover:shadow-[0_0_25px_rgba(20,184,166,.28)] sm:flex-none"
                  >
                    <Check size={16} />
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