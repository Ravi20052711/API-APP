import { useEffect, useState } from "react";
import { billingAPI } from "../services/api";
import { Check } from "lucide-react";
import toast from "react-hot-toast";

export default function BillingPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch plans (public-ish)
      const plansRes = await billingAPI.getPlans();
      setPlans(plansRes.data);

      // Fetch user's subscription (private)
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

  const handleSubscribe = async (planId) => {
    if (processing) return;

    setProcessing(true);
    try {
      const response = await billingAPI.createCheckoutSession(planId);
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error.response?.data?.detail || "Failed to initialize checkout",
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Subscription Plans
      </h2>

      {currentSubscription?.subscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            Current Plan:{" "}
            <strong>{currentSubscription.plan?.name || "Free"}</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
              currentSubscription?.plan?.id === plan.id
                ? "border-blue-500"
                : "border-transparent"
            }`}
          >
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{plan.description}</p>

            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">
                ${plan.price_monthly}
              </span>
              <span className="text-gray-600">/month</span>
            </div>

            {plan.price_yearly && (
              <p className="text-sm text-gray-500 mt-1">
                ${plan.price_yearly}/year (save $
                {(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)})
              </p>
            )}

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                {plan.included_requests.toLocaleString()} requests/month
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                {plan.rate_limit_per_minute} req/min
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                {plan.rate_limit_per_day.toLocaleString()} req/day
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />$
                {plan.overage_rate_per_request}/request overage
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={currentSubscription?.plan?.id === plan.id || processing}
              className={`mt-6 w-full py-2 px-4 rounded-md font-medium ${
                currentSubscription?.plan?.id === plan.id
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              }`}
            >
              {currentSubscription?.plan?.id === plan.id
                ? "Current Plan"
                : processing
                  ? "Processing..."
                  : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
