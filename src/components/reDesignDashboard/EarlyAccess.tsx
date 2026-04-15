import React from "react";
import { useForm, ValidationError } from "@formspree/react";

const ContactForm: React.FC = () => {
  const [state, handleSubmit] = useForm("mpqjddza");

  if (state.succeeded) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-slate-50 px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl p-8 text-center bg-white shadow-xl rounded-2xl sm:p-10">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            You're on the list 🚀
          </h2>
          <p className="text-base text-slate-600 sm:text-lg">
            We'll notify you when we launch. Stay tuned!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-slate-50 px-4 py-12 sm:py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl p-6 space-y-6 bg-white shadow-xl rounded-2xl sm:p-8 sm:space-y-7"
      >
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            Join Early Access
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Be the first to know when we launch
          </p>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-slate-700 sm:text-base"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition sm:text-base"
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
            className="mt-1.5 text-sm text-red-500"
          />
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block mb-2 text-sm font-medium text-slate-700 sm:text-base"
          >
            Message (optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Tell us anything..."
            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none sm:text-base"
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
            className="mt-1.5 text-sm text-red-500"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={state.submitting}
          className={`w-full py-3 rounded-xl font-semibold text-base text-white transition sm:py-3.5 sm:text-lg ${
            state.submitting
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-brand-500 hover:bg-brand-600 hover:shadow-lg"
          }`}
        >
          {state.submitting ? "Submitting..." : "Get Notified"}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
