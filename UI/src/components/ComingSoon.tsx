import { useNavigate } from "react-router-dom";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-[800px] w-full bg-white shadow-xl rounded-xl overflow-hidden border border-slate-100">
              {/* Hero Illustration */}
              <div className="w-full h-48 bg-blue-600/5 flex items-center justify-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(#1387ec 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                ></div>
                <div className="z-10 bg-white p-6 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-blue-600 text-6xl">
                    construction
                  </span>
                </div>
              </div>

              {/* Content Container */}
              <div className="px-8 pt-10 pb-12 flex flex-col items-center text-center">
                {/* Headline */}
                <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-4">
                  We're working on this!
                </h1>

                {/* Description */}
                <p className="text-slate-500 text-base max-w-[540px] leading-relaxed mb-8">
                  Our team is currently building this feature to help you manage
                  tasks even more efficiently. It's part of our new project
                  management suite designed for high-performance teams.
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-[480px] mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Development Progress
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      85%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full mb-3">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    Finalizing UI polish and integration testing
                  </p>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-12">
                  <button
                    className="flex items-center justify-center gap-2 min-w-[200px] h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md shadow-blue-600/20"
                    onClick={() => navigate("/dashboard")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      arrow_back
                    </span>
                    <span>Go Back to Dashboard</span>
                  </button>
                </div>

                {/* Secondary Notify Section */}
                <div className="w-full border-t border-slate-100 pt-8">
                  <h3 className="text-slate-900 text-lg font-bold mb-2">
                    Want to be the first to know?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Get notified when we launch this feature.
                  </p>
                  <div className="flex justify-center">
                    <label className="flex flex-col w-full max-w-[440px] h-12">
                      <div className="flex w-full flex-1 items-stretch rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <input
                          className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 px-4 text-sm text-slate-900 placeholder:text-slate-500"
                          placeholder="Enter your email address"
                        />
                        <div className="flex items-center justify-center pr-1">
                          <button className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 h-10 rounded-md text-sm font-bold transition-all">
                            Notify me
                          </button>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
    </div>
  );
}
