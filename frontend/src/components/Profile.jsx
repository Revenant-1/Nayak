import { useEffect, useMemo, useState } from "react";
// import {
//   User,
//   MapPin,
//   Mail,
//   Phone,
//   Calendar,
//   Briefcase,
//   Languages,
//   X,
//   Pencil,
//   Check,
//   UserRound,
//   MapPinned,
//   ShieldCheck,
//   IndianRupee,
//   Users,
// } from "lucide-react";
// import { State, City } from "country-state-city";

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
  "w-full rounded-xl border border-slate-700/80 bg-[#111827] py-3 pl-11 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "w-full rounded-xl border border-slate-700/80 bg-[#111827] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
          <Icon size={19} className="text-violet-300" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">
            {title}
          </h3>

          <p className="mt-0.5 text-xs leading-5 text-slate-500">
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
          filter: invert(1) brightness(1.5);
          opacity: .9;
          cursor: pointer;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5">

        {/* Modal */}
        <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-violet-500/20 bg-[#080D1A] text-white shadow-[0_25px_80px_rgba(0,0,0,.55)]">

          {/* ================= HEADER ================= */}
          <header className="shrink-0 border-b border-white/5 bg-[#0B1020]">

            <div className="flex items-center justify-between px-5 py-4 sm:px-7">

              <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                  <UserRound
                    size={23}
                    className="text-violet-300"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white sm:text-xl">
                    My Profile
                  </h2>

                  <p className="text-xs text-slate-500 sm:text-sm">
                    Manage your personal information
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">

                {!editing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 sm:px-4 sm:text-sm"
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-white/5 px-5 py-2.5 sm:px-7">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  editing
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />

              <span className="text-xs text-slate-500">
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

              <div className="h-px bg-white/5" />

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
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-violet-500/10 bg-violet-500/5 px-3 py-2.5">
                    <MapPin
                      size={15}
                      className="text-violet-300"
                    />

                    <span className="text-xs text-slate-400">
                      Your location helps Nayak tailor
                      information to your area.
                    </span>
                  </div>
                )}
              </Section>

              <div className="h-px bg-white/5" />

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

              <div className="h-px bg-white/5" />

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

                  <p className="mb-3 text-xs text-slate-500">
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
                              ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
                              : "border-slate-700/70 bg-[#111827] text-slate-400 hover:border-slate-600 hover:bg-[#172033]"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              selected
                                ? "border-violet-500 bg-violet-600"
                                : "border-slate-600 bg-transparent"
                            }`}
                          >
                            {selected && (
                              <Check
                                size={13}
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

              <div className="h-px bg-white/5" />

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
                  className="w-full resize-none rounded-xl border border-slate-700/80 bg-[#111827] px-4 py-3 text-sm leading-6 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Section>

              {/* ================= PRIVACY ================= */}
              <div className="flex gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>
                  <p className="text-sm font-medium text-emerald-300">
                    Your profile stays on this device
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your profile information is currently
                    stored locally in your browser.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* ================= FOOTER ================= */}
          <footer className="shrink-0 border-t border-white/5 bg-[#0B1020] px-5 py-4 sm:px-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-h-5">
                {saved && (
                  <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <Check size={15} />
                    Profile saved successfully
                  </span>
                )}
              </div>

              <div className="flex w-full gap-3 sm:w-auto">

                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-700 bg-[#111827] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-[#172033] hover:text-white sm:flex-none"
                >
                  Close
                </button>

                {editing && (
                  <button
                    onClick={handleSave}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(124,58,237,.3)] sm:flex-none"
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