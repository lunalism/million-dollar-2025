// components/main/PaymentDialog.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { OrderResponseBody } from "@paypal/paypal-js";
import { Pixel } from "@/lib/types";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pixel: Pixel | null;
  amount: number;
  onSuccess: (pixel: Pixel) => void;
}

export default function PaymentDialog({ isOpen, onClose, pixel, amount, onSuccess }: PaymentDialogProps) {
  const [paymentError, setPaymentError] = useState<string>("");

  const handlePaymentSuccess = (details: OrderResponseBody) => {
    console.log("Payment successful:", details);
    if (pixel) {
      onSuccess(pixel); // pixel prop을 직접 전달
      toast.success("Payment Successful", {
        description: `You have successfully purchased pixels at (${pixel.x}, ${pixel.y})!`,
      });
    }
    setPaymentError("");
    onClose();
  };

  const handlePaymentError = (err: unknown) => {
    console.error("Payment failed:", err);
    setPaymentError("Payment failed. Please try again.");
    toast.error("Payment Failed", {
      description: "There was an issue processing your payment. Please try again.",
    });
  };

  const handlePaymentCancel = () => {
    setPaymentError("Payment cancelled.");
    toast.info("Payment Cancelled", {
      description: "You have cancelled the payment process.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              You are purchasing pixels at ({pixel?.x}, {pixel?.y}) with size {pixel?.width}×{pixel?.height}.
              <br />
              Total Amount: ${amount.toFixed(2)}
            </p>
            {paymentError && <p className="text-red-500 text-sm mb-2">{paymentError}</p>}
            <PayPalButtons
              style={{ layout: "vertical" }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      description: `Pixel Purchase at (${pixel?.x}, ${pixel?.y})`,
                      amount: {
                        value: amount.toFixed(2),
                        currency_code: "USD",
                      },
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                if (actions.order) {
                  const details = await actions.order.capture();
                  handlePaymentSuccess(details);
                }
              }}
              onError={(err) => {
                handlePaymentError(err);
              }}
              onCancel={() => {
                handlePaymentCancel();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}