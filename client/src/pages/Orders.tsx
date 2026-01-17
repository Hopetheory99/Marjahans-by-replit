import { useEffect } from "react";
import { Link } from "wouter";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
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
    }).format(new Date(date));
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
        description: "Please sign in to view your orders.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-4xl mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-serif text-3xl mb-4">No Orders Yet</h1>
        <p className="text-muted-foreground mb-8">
          You haven't placed any orders yet. Start shopping to see your orders here.
        </p>
        <Link href="/shop">
          <Button size="lg" data-testid="button-start-shopping">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl mb-8" data-testid="page-title">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover-elevate" data-testid={`order-${order.id}`}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold" data-testid={`order-number-${order.id}`}>
                      Order #{order.id}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                  <p className="font-semibold text-primary" data-testid={`order-total-${order.id}`}>
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-order-${order.id}`}>
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
