import { useState } from "react";

import FilterTabs from "../components/mentorship/FilterTabs";
import MentorGrid from "../components/mentorship/MentorGrid";

import type { FilterKey } from "../components/mentorship/FilterTabs";

// ============================
// MOCK DATA
// ============================

const mentors = [
  {
    id: 1,
    name: "Sarah Cooper",
    subtitle: "Ex - this that",
    avatar: "https://i.pravatar.cc/100?img=5",
    tags: ["Option", "Stock"],
    type: "option",
  },
];

// ============================
// COMPONENT
// ============================

export default function Mentorship() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredData =
    filter === "all"
      ? mentors
      : mentors.filter((m) => m.type === filter);

  return (
    <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Master the Markets with Expert Guidance
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Connect with verified institutional pros to level up your trading strategy. Access exclusive live rooms and 1:1 coaching.
        </p>
      </div>

      {/* Filters */}
      <FilterTabs active={filter} onChange={setFilter} />

      <hr />

      {/* Mentor Cards */}
      <MentorGrid data={filteredData} />

    </main>
  );
}