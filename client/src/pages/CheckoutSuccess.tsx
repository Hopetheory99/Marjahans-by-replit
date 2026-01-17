import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function CheckoutSuccess() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const sessionId = searchParams.get("session_id");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/checkout/success", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/checkout/success?session_id=${sessionId}`);
      if (!response.ok) throw new Error("Failed to verify payment");
      return response.json();
    },
    enabled: !!sessionId,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    }
  }, [data, queryClient]);

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-3xl mb-4">Invalid Session</h1>
        <p className="text-muted-foreground mb-8">
          No payment session found. Please try again.
        </p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted" />
          <div className="h-8 w-64 mx-auto mb-4 bg-muted rounded" />
          <div className="h-4 w-48 mx-auto bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-3xl mb-4">Payment Verification Failed</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't verify your payment. If you were charged, please contact support.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/orders">
            <Button variant="outline">View Orders</Button>
          </Link>
          <Link href="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="text-center p-8">
        <CardContent className="pt-6 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <div>
            <h1 className="font-serif text-3xl mb-2" data-testid="success-title">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          {data?.order && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-mono font-semibold" data-testid="order-number">#{data.order.id}</p>
            </div>
          )}

          <div className="space-y-3 text-left bg-muted/30 rounded-lg p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>You'll receive an email confirmation shortly.</li>
              <li>We'll notify you when your order ships.</li>
              <li>Track your order status in your account.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full" data-testid="button-view-orders">
                View My Orders
              </Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button className="w-full" data-testid="button-continue-shopping">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
