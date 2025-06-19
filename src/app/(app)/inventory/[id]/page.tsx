// src/app/(app)/inventory/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Package,
  Edit,
  Trash2,
  PlusCircle,
  MinusCircle,
  History,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Consumable } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ConsumableService } from "@/services/consumable-service";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatedDocuments } from "@/components/common/RelatedDocuments";

export default function InventoryItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const itemId = typeof params.id === "string" ? params.id : "";

  const [tool, setTool] = useState<Consumable | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToolData = async () => {
      if (!itemId) {
        setError("No tool ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const consumableService = new ConsumableService();
        const toolData = await consumableService.getById(itemId);
        if (toolData) {
          setTool(toolData);
        } else {
          setError("Tool not found");
        }
      } catch (err) {
        console.error("Error fetching tool data:", err);
        setError("Failed to load tool data");
      } finally {
        setLoading(false);
      }
    };

    fetchToolData();
  }, [itemId]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-square w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div>
        <PageHeader title="Tool Not Found" icon={Package} />
        <Card>
          <CardContent className="pt-6">
            <p>
              {error ||
                "The requested Consumables could not be found in inventory."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/inventory">Back to Inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      const consumableService = new ConsumableService();
      await consumableService.delete(tool.id);
      toast({
        title: "Tool Deleted",
        description: `${tool.name} has been removed from inventory.`,
        variant: "destructive",
      });
      router.push("/inventory");
    } catch (error) {
      console.error("Error deleting tool:", error);
      toast({
        title: "Error",
        description: "Failed to delete the tool. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toolLifePercentage =
    tool.toolLifeHours && tool.remainingToolLifeHours !== undefined
      ? (tool.remainingToolLifeHours / tool.toolLifeHours) * 100
      : null;

  const isLowStock = tool.quantity < tool.minQuantity;

  return (
    <div>
      <PageHeader
        title={tool.name}
        icon={Package}
        description={`Details for ${tool.type}${
          tool.size ? ` (${tool.size})` : ""
        }`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/inventory">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/inventory/${tool.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the tool "{tool.name}" from inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Information</CardTitle>
              {isLowStock && (
                <Badge variant="destructive" className="mt-1">
                  Low Stock
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Type:</strong> {tool.type}
                </div>
                <div>
                  <strong>Material:</strong> {tool.material || "N/A"}
                </div>
                <div>
                  <strong>Size:</strong> {tool.size || "N/A"}
                </div>
                <div>
                  <strong>Location:</strong> {tool.location}
                </div>
                <div>
                  <strong>Quantity on Hand:</strong>{" "}
                  <span
                    className={isLowStock ? "text-destructive font-bold" : ""}
                  >
                    {tool.quantity}
                  </span>
                </div>
                <div>
                  <strong>Minimum Quantity:</strong> {tool.minQuantity}
                </div>
                {tool.supplier && (
                  <div>
                    <strong>Supplier:</strong> {tool.supplier}
                  </div>
                )}
                {tool.costPerUnit && (
                  <div>
                    <strong>Cost per Unit:</strong> $
                    {tool.costPerUnit.toFixed(2)}
                  </div>
                )}
              </div>
              {tool.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-1">Notes:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {tool.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {toolLifePercentage !== null && tool.toolLifeHours !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Tool Life</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">
                    Remaining Life
                  </span>
                  <span className="text-sm font-medium">
                    {tool.remainingToolLifeHours?.toFixed(1)} /{" "}
                    {tool.toolLifeHours.toFixed(1)} hours
                  </span>
                </div>
                <Progress value={toolLifePercentage} className="h-3" />
                {tool.lastUsedDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last used:{" "}
                    {new Date(tool.lastUsedDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                src={tool.imageUrl || "https://placehold.co/400x400.png"}
                alt={tool.name}
                width={400}
                height={400}
                className="rounded-md object-cover aspect-square w-full"
                data-ai-hint="Consumables"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Stock / Receive
              </Button>
              <Button variant="outline">
                <MinusCircle className="mr-2 h-4 w-4" /> Consume / Issue Tool
              </Button>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" /> View Usage History
              </Button>
            </CardContent>
          </Card>
          <RelatedDocuments
            objectId={tool.id}
            title="Related Documents"
            description="Upload datasheets, safety information, supplier documents, and other inventory-related files"
            defaultDocumentType="Inventory Document"
            additionalTags={[
              "inventory",
              "consumable",
              tool.type?.toLowerCase().replace(/\s+/g, "-") || "unknown",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
