import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Landmark,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import SCHEMES from "../data/schemes.json";

/*
|--------------------------------------------------------------------------
| Scheme Card
|--------------------------------------------------------------------------
*/

function SchemeCard({
  scheme,
  starred,
  onToggleStar,
  onViewDetails,
}) {
  /*
  |--------------------------------------------------------------------------
  | Format closing date
  |--------------------------------------------------------------------------
  */

  const formattedClosingDate = scheme.closingDate
    ? new Date(`${scheme.closingDate}T00:00:00`).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )
    : "No closing date";

  return (
    <article className="glass group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
      {/* Decorative gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal/10 blur-3xl transition-all duration-300 group-hover:bg-cyan/20"
      />

      {/* Top section */}
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Scheme icon */}
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
              <Landmark
                size={19}
                className="text-cyan"
              />
            </div>

            {/* Scheme name */}
            <h3 className="font-display text-base font-semibold leading-6 text-ink">
              {scheme.name}
            </h3>

            {/* Scheme type */}
            <p className="mt-1.5 text-sm text-mist">
              {scheme.type}
            </p>
          </div>

          {/* Star button */}
          <button
            type="button"
            onClick={() => onToggleStar(scheme.id)}
            aria-label={
              starred
                ? "Remove from favorites"
                : "Add to favorites"
            }
            title={
              starred
                ? "Remove from favorites"
                : "Add to favorites"
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel/70 text-mist transition-all duration-200 hover:border-teal/40 hover:bg-teal/10 hover:text-teal"
          >
            <Star
              size={17}
              className={
                starred
                  ? "fill-orange text-orange"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative mt-6">
        {/* Closing date */}
        <div className="mb-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-mist">
            Closing Date
          </span>

          <span
            className={`text-xs font-semibold ${
              scheme.closingDate
                ? "text-orange"
                : "text-mist"
            }`}
          >
            {formattedClosingDate}
          </span>
        </div>

        {/* Level + View Details */}
        <div className="flex items-center justify-between gap-3">
          {/* Scheme level */}
          <span className="rounded-full border border-cyan/20 bg-cyan/5 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-cyan">
            {scheme.level === "national"
              ? "National"
              : "State"}
          </span>

          {/* Details button */}
          <button
            type="button"
            onClick={() => onViewDetails(scheme)}
            className="gradient-btn flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold"
          >
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| Section Empty State
|--------------------------------------------------------------------------
*/

function EmptyState({
  icon: Icon = Landmark,
  message,
}) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-panel-hi">
        <Icon
          size={22}
          className="text-mist"
        />
      </div>

      <p className="text-sm text-mist">
        {message}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Section Heading
|--------------------------------------------------------------------------
*/

function SectionHeading({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal/20 bg-teal/10">
        <Icon
          size={18}
          className="text-teal"
        />
      </div>

      <div>
        <h2 className="font-display text-base font-semibold text-ink">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-mist">
          {description}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Scheme Details Modal
|--------------------------------------------------------------------------
*/

function SchemeDetailsModal({
  scheme,
  onClose,
}) {
  if (!scheme) return null;

  const formattedClosingDate = scheme.closingDate
    ? new Date(`${scheme.closingDate}T00:00:00`).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )
    : "No closing date";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scheme details"
          title="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel/70 text-mist transition-all hover:border-teal/40 hover:bg-teal/10 hover:text-teal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="pr-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
            <Landmark
              size={23}
              className="text-cyan"
            />
          </div>

          <h2 className="nayak-gradient-text font-display text-2xl font-bold">
            {scheme.name}
          </h2>

          <p className="mt-1.5 text-sm text-mist">
            {scheme.type}
          </p>
        </div>

        {/* Basic information */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Category */}
          {scheme.category && (
            <div className="rounded-xl border border-line bg-panel/50 p-4">
              <p className="text-xs text-mist">
                Category
              </p>

              <p className="mt-1 text-sm font-semibold text-ink">
                {scheme.category}
              </p>
            </div>
          )}

          {/* Government level */}
          <div className="rounded-xl border border-line bg-panel/50 p-4">
            <p className="text-xs text-mist">
              Government Level
            </p>

            <p className="mt-1 text-sm font-semibold text-ink">
              {scheme.level === "national"
                ? "National"
                : "State"}
            </p>
          </div>

          {/* State */}
          {scheme.state && (
            <div className="rounded-xl border border-line bg-panel/50 p-4">
              <p className="text-xs text-mist">
                State
              </p>

              <p className="mt-1 text-sm font-semibold text-ink">
                {scheme.state}
              </p>
            </div>
          )}

          {/* Closing date */}
          <div className="rounded-xl border border-line bg-panel/50 p-4">
            <p className="text-xs text-mist">
              Closing Date
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${
                scheme.closingDate
                  ? "text-orange"
                  : "text-mist"
              }`}
            >
              {formattedClosingDate}
            </p>
          </div>
        </div>

        {/* Description */}
        {scheme.description && (
          <div className="mt-6">
            <h3 className="font-display text-sm font-semibold text-ink">
              About this scheme
            </h3>

            <p className="mt-2 text-sm leading-6 text-mist">
              {scheme.description}
            </p>
          </div>
        )}

        {/* Benefits */}
        {scheme.benefits && (
          <div className="mt-6">
            <h3 className="font-display text-sm font-semibold text-ink">
              Benefits
            </h3>

            <p className="mt-2 text-sm leading-6 text-mist">
              {scheme.benefits}
            </p>
          </div>
        )}

        {/* Eligibility */}
        {scheme.eligibility && (
          <div className="mt-6">
            <h3 className="font-display text-sm font-semibold text-ink">
              Eligibility
            </h3>

            <p className="mt-2 text-sm leading-6 text-mist">
              {scheme.eligibility}
            </p>
          </div>
        )}

        {/* How to apply */}
        {scheme.howToApply && (
          <div className="mt-6">
            <h3 className="font-display text-sm font-semibold text-ink">
              How to Apply
            </h3>

            <p className="mt-2 text-sm leading-6 text-mist">
              {scheme.howToApply}
            </p>
          </div>
        )}

        {/* Official website */}
        {scheme.officialUrl && (
          <div className="mt-7">
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-btn inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              Visit Official Website
              <ArrowRight size={15} />
            </a>
          </div>
        )}

        {/* Bottom close */}
        <div className="mt-7 flex justify-end border-t border-line pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-panel/70 px-4 py-2 text-sm font-medium text-mist transition-all hover:bg-panel-hi hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Scheme Page
|--------------------------------------------------------------------------
*/

export default function Scheme() {
  const [activeSection, setActiveSection] =
    useState("my");

  const [allSchemeLevel, setAllSchemeLevel] =
    useState("national");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [profile, setProfile] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Selected scheme
  |--------------------------------------------------------------------------
  */

  const [selectedScheme, setSelectedScheme] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Profile
  |--------------------------------------------------------------------------
  | Profile.jsx stores the profile as "nayakProfile".
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile =
        localStorage.getItem("nayakProfile");

      if (!storedProfile) {
        setProfile(null);
        return;
      }

      try {
        setProfile(
          JSON.parse(storedProfile)
        );
      } catch {
        setProfile(null);
      }
    };

    loadProfile();

    window.addEventListener(
      "storage",
      loadProfile
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadProfile
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Starred schemes
  |--------------------------------------------------------------------------
  */

  const [starredIds, setStarredIds] =
    useState(() => {
      const stored =
        localStorage.getItem(
          "nayakStarredSchemes"
        );

      if (!stored) return [];

      try {
        const parsed =
          JSON.parse(stored);

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch {
        return [];
      }
    });

  useEffect(() => {
    localStorage.setItem(
      "nayakStarredSchemes",
      JSON.stringify(starredIds)
    );
  }, [starredIds]);

  const toggleStar = (schemeId) => {
    setStarredIds((current) =>
      current.includes(schemeId)
        ? current.filter(
            (id) => id !== schemeId
          )
        : [...current, schemeId]
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Suggested schemes
  |--------------------------------------------------------------------------
  */

  const suggestedSchemes = useMemo(() => {
    if (!profile) return [];

    const occupation = String(
      profile.occupation || ""
    ).toLowerCase();

    const gender = String(
      profile.gender || ""
    ).toLowerCase();

    const specialStatus =
      Array.isArray(profile.specialStatus)
        ? profile.specialStatus.map(
            (item) =>
              String(item).toLowerCase()
          )
        : [];

    const isStudent =
      occupation.includes("student");

    const isFarmer =
      occupation.includes("farmer") ||
      occupation.includes("agriculture");

    const isWoman =
      gender.includes("female") ||
      gender.includes("woman");

    const results = SCHEMES.filter(
      (scheme) => {
        /*
        |--------------------------------------------------------------------------
        | State scheme filtering
        |--------------------------------------------------------------------------
        */

        if (
          scheme.level === "state" &&
          scheme.state &&
          profile.state &&
          scheme.state.toLowerCase() !==
            String(
              profile.state
            ).toLowerCase()
        ) {
          return false;
        }

        /*
        |--------------------------------------------------------------------------
        | Student → Education
        |--------------------------------------------------------------------------
        */

        if (
          isStudent &&
          scheme.category === "Education"
        ) {
          return true;
        }

        /*
        |--------------------------------------------------------------------------
        | Farmer → Agriculture
        |--------------------------------------------------------------------------
        */

        if (
          isFarmer &&
          scheme.category === "Agriculture"
        ) {
          return true;
        }

        /*
        |--------------------------------------------------------------------------
        | Women → Women & Family
        |--------------------------------------------------------------------------
        */

        if (
          isWoman &&
          scheme.category ===
            "Women & Family"
        ) {
          return true;
        }

        /*
        |--------------------------------------------------------------------------
        | Special status → Health
        |--------------------------------------------------------------------------
        */

        if (
          specialStatus.length > 0 &&
          scheme.category === "Health"
        ) {
          return true;
        }

        /*
        |--------------------------------------------------------------------------
        | General national schemes
        |--------------------------------------------------------------------------
        */

        if (
          scheme.level === "national"
        ) {
          return true;
        }

        return false;
      }
    );

    return results.slice(0, 6);
  }, [profile]);

  /*
  |--------------------------------------------------------------------------
  | Starred schemes
  |--------------------------------------------------------------------------
  */

  const starredSchemes = useMemo(
    () =>
      SCHEMES.filter((scheme) =>
        starredIds.includes(scheme.id)
      ),
    [starredIds]
  );

  /*
  |--------------------------------------------------------------------------
  | All schemes
  |--------------------------------------------------------------------------
  */

  const filteredAllSchemes = useMemo(() => {
    let results = SCHEMES.filter(
      (scheme) =>
        scheme.level ===
        allSchemeLevel
    );

    /*
    |--------------------------------------------------------------------------
    | State-level schemes
    |--------------------------------------------------------------------------
    */

    if (
      allSchemeLevel === "state" &&
      profile?.state
    ) {
      results = results.filter(
        (scheme) =>
          !scheme.state ||
          scheme.state.toLowerCase() ===
            String(
              profile.state
            ).toLowerCase()
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const query = searchQuery
      .trim()
      .toLowerCase();

    if (query) {
      results = results.filter(
        (scheme) =>
          String(scheme.name || "")
            .toLowerCase()
            .includes(query) ||
          String(scheme.type || "")
            .toLowerCase()
            .includes(query) ||
          String(scheme.category || "")
            .toLowerCase()
            .includes(query)
      );
    }

    return results;
  }, [
    allSchemeLevel,
    profile,
    searchQuery,
  ]);

  /*
  |--------------------------------------------------------------------------
  | View details
  |--------------------------------------------------------------------------
  */

  const handleViewDetails = (scheme) => {
    setSelectedScheme(scheme);
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent">

      {/* =========================================================
          SCROLLABLE CONTENT
      ========================================================= */}

      <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 sm:py-8">

          {/* =====================================================
              MAIN SECTION SWITCH
          ===================================================== */}

          <div className="mb-8 flex w-fit rounded-xl border border-line bg-panel/70 p-1 backdrop-blur-xl">

            <button
              type="button"
              onClick={() =>
                setActiveSection("my")
              }
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeSection === "my"
                  ? "gradient-btn"
                  : "text-mist hover:bg-panel-hi hover:text-ink"
              }`}
            >
              My Schemes
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("all")
              }
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeSection === "all"
                  ? "gradient-btn"
                  : "text-mist hover:bg-panel-hi hover:text-ink"
              }`}
            >
              All Schemes
            </button>
          </div>

          {/* =====================================================
              MY SCHEMES
          ===================================================== */}

          {activeSection === "my" && (
            <div className="space-y-10">

              {/* Suggested */}
              <section>
                <SectionHeading
                  icon={Sparkles}
                  title="Suggested Schemes"
                  description="Schemes suggested based on the information in your profile."
                />

                {!profile ? (
                  <EmptyState
                    message="Complete your profile to receive personalized scheme suggestions."
                  />
                ) : suggestedSchemes.length === 0 ? (
                  <EmptyState
                    message="No schemes match your current profile."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {suggestedSchemes.map(
                      (scheme) => (
                        <SchemeCard
                          key={scheme.id}
                          scheme={scheme}
                          starred={starredIds.includes(
                            scheme.id
                          )}
                          onToggleStar={
                            toggleStar
                          }
                          onViewDetails={
                            handleViewDetails
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </section>

              {/* Starred */}
              <section>
                <SectionHeading
                  icon={Star}
                  title="Starred Schemes"
                  description="Your saved schemes for quick access later."
                />

                {starredSchemes.length === 0 ? (
                  <EmptyState
                    icon={Star}
                    message="You haven't starred any schemes yet."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {starredSchemes.map(
                      (scheme) => (
                        <SchemeCard
                          key={scheme.id}
                          scheme={scheme}
                          starred
                          onToggleStar={
                            toggleStar
                          }
                          onViewDetails={
                            handleViewDetails
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =====================================================
              ALL SCHEMES
          ===================================================== */}

          {activeSection === "all" && (
            <section>

              {/* Controls */}
              <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                {/* National / State */}
                <div className="flex w-fit rounded-xl border border-line bg-panel/70 p-1 backdrop-blur-xl">

                  <button
                    type="button"
                    onClick={() =>
                      setAllSchemeLevel(
                        "national"
                      )
                    }
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      allSchemeLevel ===
                      "national"
                        ? "gradient-btn"
                        : "text-mist hover:bg-panel-hi hover:text-ink"
                    }`}
                  >
                    National Level
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAllSchemeLevel(
                        "state"
                      )
                    }
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      allSchemeLevel ===
                      "state"
                        ? "gradient-btn"
                        : "text-mist hover:bg-panel-hi hover:text-ink"
                    }`}
                  >
                    State Level
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-80">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist"
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search schemes..."
                    className="glass w-full rounded-xl px-4 py-3 pl-10 text-sm text-ink outline-none placeholder:text-mist"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="mb-5">
                <h2 className="font-display text-base font-semibold text-ink">
                  {allSchemeLevel ===
                  "national"
                    ? "National Level Schemes"
                    : profile?.state
                      ? `${profile.state} State Schemes`
                      : "State Level Schemes"}
                </h2>

                <p className="mt-1 text-xs text-mist">
                  {allSchemeLevel ===
                  "national"
                    ? "Government schemes available across India."
                    : "Government schemes provided by the state government."}
                </p>
              </div>

              {/* Cards */}
              {filteredAllSchemes.length === 0 ? (
                <EmptyState
                  message="No schemes match your search."
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAllSchemes.map(
                    (scheme) => (
                      <SchemeCard
                        key={scheme.id}
                        scheme={scheme}
                        starred={starredIds.includes(
                          scheme.id
                        )}
                        onToggleStar={
                          toggleStar
                        }
                        onViewDetails={
                          handleViewDetails
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* =========================================================
          SCHEME DETAILS MODAL
      ========================================================= */}

      {selectedScheme && (
        <SchemeDetailsModal
          scheme={selectedScheme}
          onClose={() =>
            setSelectedScheme(null)
          }
        />
      )}
    </div>
  );
}