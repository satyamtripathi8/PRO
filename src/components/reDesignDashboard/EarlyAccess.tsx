import React from "react";
import { useForm, ValidationError } from "@formspree/react";

const ContactForm: React.FC = () => {
  const [state, handleSubmit] = useForm("mpqjddza");

  if (state.succeeded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-2xl p-12 text-center bg-white shadow-xl rounded-3xl">
          <h2 className="mb-6 text-4xl font-bold text-slate-900 lg:text-5xl">
            You're on the list 🚀
          </h2>
          <p className="text-xl text-slate-600 lg:text-2xl">
            We'll notify you when we launch. Stay tuned!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl p-12 space-y-8 bg-white shadow-xl rounded-3xl"
      >
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900 lg:text-5xl">
            Join Early Access
          </h2>
          <p className="mt-3 text-lg text-slate-500 lg:text-xl">
            Be the first to know when we launch
          </p>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block mb-3 text-base font-medium text-slate-700 lg:text-lg"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full px-5 py-4 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition lg:text-lg"
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
            className="mt-2 text-base text-red-500"
          />
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block mb-3 text-base font-medium text-slate-700 lg:text-lg"
          >
            Message (optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Tell us anything..."
            className="w-full px-5 py-4 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none lg:text-lg"
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
            className="mt-2 text-base text-red-500"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={state.submitting}
          className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition lg:text-xl lg:py-5 ${
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
