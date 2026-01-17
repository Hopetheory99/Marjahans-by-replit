import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Order, ShippingAddress } from "@shared/schema";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Order not found");
        throw new Error("Failed to fetch order");
      }
      return response.json();
    },
    enabled: isAuthenticated && !!id,
  });

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "delivered":
        return <Package className="h-5 w-5 text-purple-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "shipped":
        return <Badge className="bg-blue-500">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-purple-500">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view order details.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-serif text-3xl mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link href="/orders">
          <Button>View All Orders</Button>
        </Link>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress as ShippingAddress | null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-2" data-testid="order-title">
            Order #{order.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Total</span>
              <span className="font-semibold text-primary text-lg" data-testid="order-total">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono">#{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Date</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(order.updatedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            {shippingAddress ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                <p className="text-muted-foreground">{shippingAddress.address}</p>
                <p className="text-muted-foreground">
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                </p>
                <p className="text-muted-foreground">{shippingAddress.country}</p>
                <Separator className="my-3" />
                <p className="text-muted-foreground">{shippingAddress.email}</p>
                <p className="text-muted-foreground">{shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No shipping address available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              If you have questions about your order, please contact our customer support team.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
              <Link href="/shop">
                <Button size="sm">Continue Shopping</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
