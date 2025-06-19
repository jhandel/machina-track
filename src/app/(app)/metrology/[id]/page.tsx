// src/app/(app)/metrology/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Ruler,
  Edit,
  Trash2,
  CalendarPlus,
  ListChecks,
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
import type { MetrologyTool, CalibrationLog } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { AddCalibrationLogModal } from "../components/AddCalibrationLogModal";
import { EditCalibrationLogModal } from "../components/EditCalibrationLogModal";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetrologyService } from "@/services/metrology-service";

export default function MetrologyToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const toolId = typeof params.id === "string" ? params.id : "";

  const [tool, setTool] = useState<MetrologyTool | undefined>(undefined);
  const [calibrationLogs, setCalibrationLogs] = useState<CalibrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToolData = async () => {
      if (!toolId) {
        setError("No tool ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const metrologyService = new MetrologyService();
        const fetchedTool = await metrologyService.getById(toolId);

        if (!fetchedTool) {
          setError("Tool not found");
          setTool(undefined);
        } else {
          setTool(fetchedTool);
          // Fetch calibration logs for this tool
          try {
            const logs = await metrologyService.getCalibrationLogs(
              fetchedTool.id
            );
            setCalibrationLogs(logs);
          } catch (logError) {
            console.warn("Could not fetch calibration logs:", logError);
            // Don't fail the whole page if logs can't be fetched
            setCalibrationLogs([]);
          }
        }
      } catch (err) {
        console.error("Error fetching tool:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch tool data"
        );
        setTool(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchToolData();
  }, [toolId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading..." icon={Ruler} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading tool details...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div>
        <PageHeader title="Metrology Tool Not Found" icon={Ruler} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              {error || "The requested metrology tool could not be found."}
            </p>
            <Button asChild>
              <Link href="/metrology">Back to Metrology List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      const metrologyService = new MetrologyService();
      await metrologyService.delete(tool.id);

      toast({
        title: "Tool Deleted",
        description: `${tool.name} has been removed successfully.`,
        variant: "destructive",
      });

      router.push("/metrology");
    } catch (error) {
      console.error("Error deleting tool:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete tool",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: MetrologyTool["status"]) => {
    switch (status) {
      case "calibrated":
        return "default"; // Often green or blue
      case "due_calibration":
        return "secondary"; // Check theme for yellow/orange
      case "out_of_calibration":
        return "destructive";
      case "awaiting_calibration":
        return "outline"; // Check theme for a neutral/pending color
      default:
        return "outline";
    }
  };
  const getResultBadgeVariant = (result: CalibrationLog["result"]) => {
    switch (result) {
      case "pass":
        return "default";
      case "fail":
        return "destructive";
      case "adjusted":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div>
      <PageHeader
        title={tool.name}
        icon={Ruler}
        description={`Details for ${tool.type} (S/N: ${tool.serialNumber})`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/metrology">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Metrology
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/metrology/${tool.id}/edit`}>
                {" "}
                {/* Placeholder for edit page */}
                <Edit className="mr-2 h-4 w-4" /> Edit Tool
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Tool
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the tool "{tool.name}".
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Type:</strong> {tool.type}
                </div>
                <div>
                  <strong>Serial Number:</strong> {tool.serialNumber}
                </div>
                <div>
                  <strong>Manufacturer:</strong> {tool.manufacturer || "N/A"}
                </div>
                <div>
                  <strong>Location:</strong> {tool.location || "N/A"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <Badge
                    variant={getStatusBadgeVariant(tool.status)}
                    className="capitalize"
                  >
                    {tool.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <strong>Calibration Interval:</strong>{" "}
                  {tool.calibrationIntervalDays} days
                </div>
                {tool.lastCalibrationDate && (
                  <div>
                    <strong>Last Calibrated:</strong>{" "}
                    {new Date(tool.lastCalibrationDate).toLocaleDateString()}
                  </div>
                )}
                {tool.nextCalibrationDate && (
                  <div>
                    <strong>Next Calibration Due:</strong>{" "}
                    <span
                      className={
                        new Date(tool.nextCalibrationDate) < new Date() &&
                        tool.status !== "calibrated"
                          ? "text-destructive font-bold"
                          : ""
                      }
                    >
                      {new Date(tool.nextCalibrationDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              {tool.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-semibold mb-1">Notes:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {tool.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <AddCalibrationLogModal
                metrologyTool={tool}
                onCalibrationLogAdded={() => {
                  // Refetch calibration logs when a new one is added
                  const fetchCalibrationLogs = async () => {
                    try {
                      const metrologyService = new MetrologyService();
                      const logs = await metrologyService.getCalibrationLogs(
                        tool.id
                      );
                      setCalibrationLogs(logs);
                    } catch (error) {
                      console.error(
                        "Failed to refresh calibration logs:",
                        error
                      );
                    }
                  };
                  fetchCalibrationLogs();
                }}
              />
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calibration History</CardTitle>
              <CardDescription>
                Recent calibration logs for this tool.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calibrationLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Next Due
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calibrationLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{log.performedBy}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getResultBadgeVariant(log.result)}
                            className="capitalize"
                          >
                            {log.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {log.nextDueDate
                            ? new Date(log.nextDueDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {log.certificateUrl && (
                              <Button variant="link" size="sm" asChild>
                                <Link href={log.certificateUrl} target="_blank">
                                  View Cert
                                </Link>
                              </Button>
                            )}
                            <EditCalibrationLogModal
                              metrologyTool={tool}
                              calibrationLogId={log.id}
                              onCalibrationLogUpdated={() => {
                                // Refetch calibration logs when updated
                                const fetchCalibrationLogs = async () => {
                                  try {
                                    const metrologyService =
                                      new MetrologyService();
                                    const logs =
                                      await metrologyService.getCalibrationLogs(
                                        tool.id
                                      );
                                    setCalibrationLogs(logs);
                                  } catch (error) {
                                    console.error(
                                      "Failed to refresh calibration logs:",
                                      error
                                    );
                                  }
                                };
                                fetchCalibrationLogs();
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No calibration logs found for this tool.
                </p>
              )}
            </CardContent>
          </Card>
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
                data-ai-hint="metrology tool"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="link" asChild className="justify-start px-0">
                <Link href="#">View SOP (PDF)</Link>
              </Button>
              <Button variant="link" asChild className="justify-start px-0">
                <Link href="#">Manufacturer Specs (PDF)</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
