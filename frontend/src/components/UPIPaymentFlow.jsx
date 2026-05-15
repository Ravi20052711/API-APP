import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { billingAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const IndianRupee = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c5 0 5-10 0-10H6" />
  </svg>
);

export default function UPIPaymentFlow({ plans }) {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleNext = () => {
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      await billingAPI.subscribe(selectedPlan.id);
      setStep(4);
      toast.success("Payment Verified!");
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Step 1: Selection
  if (step === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans
          .filter((p) => p.price_monthly > 0)
          .map((plan) => (
            <div
              key={plan.id}
              className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:border-indigo-500 transition-all shadow-sm flex flex-col hover:shadow-xl group"
            >
              <div className="mb-4">
                <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase">
                  Premium Plan
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                {plan.name}
              </h3>
              <p className="text-gray-500 mt-2 line-clamp-2">
                {plan.description}
              </p>
              <div className="my-8">
                <span className="text-5xl font-black text-gray-900 flex items-baseline gap-1">
                  <IndianRupee className="w-8 h-8" />
                  {plan.price_monthly.toLocaleString()}
                </span>
                <p className="text-gray-400 font-bold mt-1 uppercase text-xs">
                  Per Billing Cycle
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <CheckCircle className="w-6 h-6 text-green-500" /> High Rate
                  Limits
                </li>
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <CheckCircle className="w-6 h-6 text-green-500" /> Marketplace
                  Unlocked
                </li>
              </ul>
              <button
                onClick={() => handleSelectPlan(plan)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Select {plan.name} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ))}
      </div>
    );
  }

  // Step 2: Show Number
  if (step === 2) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-10 text-white text-center">
          <IndianRupee className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-black">UPI Payment Details</h3>
          <p className="opacity-80 mt-1">
            Please pay the subscription fee to the number below.
          </p>
        </div>
        <div className="p-10 space-y-8">
          <div className="text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Merchant UPI ID / Phone
            </p>
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-indigo-100 relative group">
              <p className="text-3xl font-black text-indigo-600 tracking-tighter">
                8125678954
              </p>
              <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">
                Verified Merchant Account
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between font-bold text-sm">
              <span className="text-gray-400">Total Payable</span>
              <span className="text-gray-900">
                ₹{selectedPlan.price_monthly.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span className="text-gray-400">Merchant</span>
              <span className="text-gray-900">MeterFlow Platform</span>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
          >
            I have made the payment <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setStep(1)}
            className="w-full text-gray-400 text-sm font-bold hover:text-gray-900 transition-colors uppercase tracking-widest"
          >
            Change Plan
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === 3) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100">
        <ShieldCheck className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Ready to Verify?
        </h2>
        <p className="text-gray-500 mb-10 leading-relaxed font-medium">
          Click the button below to confirm your transaction. Our gateway will
          instantly verify the payment status.
        </p>

        <button
          onClick={handleConfirmPayment}
          disabled={processing}
          className="w-full py-5 bg-green-600 text-white rounded-2xl font-black hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3"
        >
          {processing ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />{" "}
              Verifying...
            </>
          ) : (
            "Complete Activation"
          )}
        </button>
        <p className="text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">
          Secured by UPI Auto-Verify
        </p>
      </div>
    );
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100 animate-in slide-in-from-bottom duration-500">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-3">Successful!</h2>
        <p className="text-gray-500 mb-10 font-medium">
          Payment confirmed. Your <strong>{selectedPlan.name}</strong> access is
          now active across the entire platform.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
}
