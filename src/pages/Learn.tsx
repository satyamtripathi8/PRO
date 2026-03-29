import { useState } from "react";

import LearnTabs from "../components/learning/LearnTabs";
import ContinueLearningCard from "../components/learning/ContinueLearningCard";
import CourseCard from "../components/learning/CourseCard";
import SectionHeader from "../components/learning/SectionHeader";

import type { LearnTab } from "../components/learning/LearnTabs";

// ============================
// MOCK DATA
// ============================

const continueLearning = {
  title: "Advance Patterns: Harmonic Trading",
  description:
    "Master the art of identifying harmonic patterns like the Gartley, Bat and Butterfly to predict market reversals with high precision.",
  image: "https://picsum.photos/200/100",
  progress: 75,
  module: "Module 3 of 8",
};

const basicCourses = [
  {
    id: 1,
    title: "Basic Terminology: Harmonic Trading",
    description:
      "Master the art of identifying harmonic patterns to predict market reversals.",
    image: "https://picsum.photos/200/101",
    progress: 75,
    modules: 8,
    duration: "2h 30m",
  },
];

const advancedCourses = [
  {
    id: 2,
    title: "Advance Patterns: Harmonic Trading",
    description:
      "Master the art of identifying harmonic patterns to predict market reversals.",
    image: "https://picsum.photos/200/102",
    progress: 75,
    modules: 8,
    duration: "2h 30m",
  },
];

// ============================
// COMPONENT
// ============================

export default function Learn() {
  const [tab, setTab] = useState<LearnTab>("assets");

  return (
    <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Learning Center</h1>
        <p className="text-gray-500 text-sm">
          Upgrade your trading skills with professional courses and community insights.
        </p>
      </div>

      {/* Tabs */}
      <LearnTabs active={tab} onChange={setTab} />

      {/* Continue Learning */}
      <section className="space-y-3">
        <SectionHeader title="Continue Learning" />
        <ContinueLearningCard {...continueLearning} />
      </section>

      {/* Basic Assets */}
      <section className="space-y-3">
        <SectionHeader title="Basic Assets" />
        {basicCourses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </section>

      {/* Advance Assets */}
      <section className="space-y-3">
        <SectionHeader title="Advance Assets" />
        {advancedCourses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </section>

    </main>
  );
}