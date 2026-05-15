import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { billingAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  ArrowLeft,
  Loader2,
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

export default function UPIPaymentFlow({ plans, preSelectedPlan, onCancel }) {
  const [step, setStep] = useState(preSelectedPlan ? 2 : 1);
  const [selectedPlan, setSelectedPlan] = useState(preSelectedPlan);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (preSelectedPlan) {
      setSelectedPlan(preSelectedPlan);
      setStep(2);
    }
  }, [preSelectedPlan]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleNext = () => {
    setStep(3);
    // Simulate verification delay
    setTimeout(() => {
      handleConfirmPayment();
    }, 2500);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      await billingAPI.subscribe(selectedPlan.id);
      setStep(4);
      toast.success("Payment Verified & Subscription Activated!");
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      setStep(2); // Go back to payment step on fail
    } finally {
      setProcessing(false);
    }
  };

  // Step 1: Selection (Fallback if no plan provided)
  if (step === 1) {
    return (
      <div className="animate-in fade-in duration-300">
        <button
          onClick={onCancel}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans
            .filter((p) => p.price_monthly > 0)
            .map((plan) => (
              <div
                key={plan.id}
                className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:border-indigo-500 transition-all shadow-sm flex flex-col hover:shadow-xl group cursor-pointer"
                onClick={() => handleSelectPlan(plan)}
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
                    ${plan.price_monthly.toLocaleString()}
                  </span>
                  <p className="text-gray-400 font-bold mt-1 uppercase text-xs">
                    Per Month
                  </p>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3 text-gray-700 font-medium">
                    <CheckCircle className="w-6 h-6 text-green-500" /> High Rate
                    Limits
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 font-medium">
                    <CheckCircle className="w-6 h-6 text-green-500" />{" "}
                    Marketplace Unlocked
                  </li>
                </ul>
                <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black group-hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                  Select {plan.name} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Step 2: Show QR / Details
  if (step === 2) {
    return (
      <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-300">
        <button
          onClick={onCancel}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')] opacity-20"></div>
            <div className="relative z-10">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-indigo-200" />
              <h3 className="text-2xl font-black">Secure Checkout</h3>
              <p className="text-indigo-100 mt-1 font-medium">
                Complete your upgrade to {selectedPlan.name}
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Order Summary
              </h4>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900">
                  {selectedPlan.name}
                </span>
                <span className="font-bold text-gray-900">
                  ${selectedPlan.price_monthly.toLocaleString()}/mo
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  Includes {selectedPlan.included_requests.toLocaleString()}{" "}
                  reqs
                </span>
                <span>Billed Monthly</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-black text-gray-900">Total Due</span>
                <span className="text-2xl font-black text-indigo-600">
                  ${selectedPlan.price_monthly.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Scan with any UPI App
              </p>
              <div className="inline-block p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm mb-4 relative group cursor-pointer">
                <QrCode className="w-48 h-48 text-gray-800" />
                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl backdrop-blur-sm">
                  <span className="font-bold text-indigo-600">
                    Mock QR Code
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 py-2 px-4 rounded-lg w-max mx-auto">
                <span>UPI ID:</span>
                <span className="font-bold text-gray-900 select-all">
                  pay@meterflow
                </span>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-lg"
            >
              I have completed the payment <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation / Verifying
  if (step === 3) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-2xl p-12 text-center border border-gray-100 mt-10">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <ShieldCheck className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Verifying Payment...
        </h2>
        <p className="text-gray-500 mb-6 leading-relaxed font-medium">
          Please wait while we confirm your transaction securely. Do not close
          this window.
        </p>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Secure Connection Established
        </p>
      </div>
    );
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-2xl p-12 text-center border border-gray-100 animate-in slide-in-from-bottom duration-500 mt-10">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-50"></div>
          <CheckCircle className="w-12 h-12 text-green-600 relative z-10" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-3">
          Upgrade Complete!
        </h2>
        <p className="text-gray-500 mb-10 font-medium text-lg">
          Your payment was successful. You are now on the{" "}
          <span className="font-bold text-gray-900">{selectedPlan.name}</span>{" "}
          plan.
        </p>
        <button
          onClick={() => {
            if (onCancel) onCancel();
            else navigate("/dashboard");
          }}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-black hover:bg-indigo-600 transition-all shadow-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
}
