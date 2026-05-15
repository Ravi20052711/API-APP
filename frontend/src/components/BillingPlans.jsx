import { useEffect, useState } from "react";
import { billingAPI } from "../services/api";
import { Check, Star } from "lucide-react";
import toast from "react-hot-toast";
import UPIPaymentFlow from "./UPIPaymentFlow";

export default function BillingPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState("plans");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const plansRes = await billingAPI.getPlans();
      setPlans(plansRes.data);

      try {
        const subscriptionRes = await billingAPI.getSubscription();
        setCurrentSubscription(subscriptionRes.data);
      } catch (subError) {
        console.warn("Failed to fetch user subscription:", subError);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (processing) return;
    setSelectedPlan(plan);
    setStep("payment");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <UPIPaymentFlow
        plans={plans}
        preSelectedPlan={selectedPlan}
        onCancel={() => setStep("plans")}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-black text-gray-900 mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-gray-500">
          Choose the plan that best fits your API needs. No hidden fees.
        </p>
      </div>

      {currentSubscription?.subscription && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-indigo-900">
              Current Plan:{" "}
              <span className="text-indigo-600">
                {currentSubscription.plan?.name || "Free"}
              </span>
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              Your subscription is active and in good standing.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Status
            </span>
            <div className="text-green-500 font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Active
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 items-start">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
          const isPro = plan.name.toLowerCase().includes("pro");

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-[2rem] p-8 border-2 flex flex-col transition-all duration-300 hover:shadow-xl ${
                isCurrentPlan
                  ? "border-green-500 shadow-lg ring-4 ring-green-50"
                  : isPro
                    ? "border-indigo-600 shadow-2xl scale-105 z-10"
                    : "border-gray-100 hover:border-indigo-200"
              }`}
            >
              {isPro && !isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-current" /> Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                  Current Plan
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-2xl font-black ${isPro ? "text-indigo-600" : "text-gray-900"}`}
                >
                  {plan.name}
                </h3>
                <p className="text-gray-500 text-sm mt-2 h-10">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black text-gray-900">
                  ${plan.price_monthly}
                </span>
                <span className="text-gray-500 font-medium">/mo</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>
                    <strong>{plan.included_requests.toLocaleString()}</strong>{" "}
                    requests/mo
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>
                    <strong>{plan.rate_limit_per_minute}</strong> req/min
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>
                    <strong>{plan.rate_limit_per_day.toLocaleString()}</strong>{" "}
                    req/day
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>
                    <strong>${plan.overage_rate_per_request}</strong> per extra
                    request
                  </span>
                </li>
                {plan.features &&
                  plan.features.split(",").map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-700 font-medium"
                    >
                      <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <span>{feature.trim()}</span>
                    </li>
                  ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrentPlan || processing}
                className={`mt-auto w-full py-4 rounded-xl font-bold transition-all ${
                  isCurrentPlan
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isPro
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:-translate-y-0.5"
                }`}
              >
                {isCurrentPlan
                  ? "Active Plan"
                  : processing
                    ? "Processing..."
                    : plan.price_monthly === 0
                      ? "Get Started"
                      : "Subscribe Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
