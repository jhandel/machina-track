// src/app/(app)/maintenance/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  ClipboardList,
  Edit,
  Trash2,
  CheckSquare,
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
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { MaintenanceTask, Equipment, ServiceRecord } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
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
import {
  MaintenanceService,
  maintenanceService,
} from "@/services/maintenance-service";
import {
  EquipmentService,
  equipmentService,
} from "@/services/equipment-service";
import {
  ServiceRecordService,
  serviceRecordService,
} from "@/services/service-record-service";
import CompleteMaintenanceModal from "../components/CompleteMaintenanceModal";
import { RelatedDocuments } from "@/components/common/RelatedDocuments";

export default function MaintenanceTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskId = typeof params.id === "string" ? params.id : "";

  const [task, setTask] = useState<MaintenanceTask | undefined>(undefined);
  const [equipment, setEquipment] = useState<Equipment | undefined>(undefined);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) {
        setError("No task ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedTask = await maintenanceService.getById(taskId);

        if (!fetchedTask) {
          setError("Task not found");
          setTask(undefined);
        } else {
          setTask(fetchedTask);

          // Fetch related equipment data
          try {
            const fetchedEquipment = await equipmentService.getById(
              fetchedTask.equipmentId
            );
            setEquipment(fetchedEquipment);
          } catch (equipmentError) {
            console.warn("Could not fetch equipment data:", equipmentError);
            setEquipment(undefined);
          }

          // Fetch service records for this task
          try {
            const records = await serviceRecordService.getByTaskId(
              fetchedTask.id
            );
            setServiceRecords(records || []);
          } catch (serviceError) {
            console.warn("Could not fetch service records:", serviceError);
            setServiceRecords([]);
          }
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch task data"
        );
        setTask(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading..." icon={ClipboardList} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading task details...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div>
        <PageHeader title="Maintenance Task Not Found" icon={ClipboardList} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              {error || "The requested maintenance task could not be found."}
            </p>
            <Button asChild>
              <Link
                href="/maintenance"
                className="inline-flex items-center justify-center gap-2"
              >
                Back to Maintenance List
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await maintenanceService.delete(task.id);

      toast({
        title: "Task Deleted",
        description: `${task.description} has been removed successfully.`,
        variant: "destructive",
      });

      router.push("/maintenance");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  /**
   * This method is deprecated in favor of using the CompleteMaintenanceModal
   * which creates a service record when completing maintenance.
   * @deprecated
   */
  const handleMarkCompleted = async () => {
    try {
      const updatedTask = await maintenanceService.markCompleted(task.id);
      setTask(updatedTask);

      toast({
        title: "Task Completed",
        description: `${task.description} has been marked as completed.`,
      });
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleMaintenanceCompleted = (
    updatedTask: MaintenanceTask,
    serviceRecord: ServiceRecord
  ) => {
    setTask(updatedTask);

    // Add the new service record to the list
    setServiceRecords((prev) => [serviceRecord, ...prev]);
  };

  const getStatusBadgeVariant = (status: MaintenanceTask["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "overdue":
        return "destructive";
      case "pending":
        return "outline";
      case "skipped":
        return "destructive";
      default:
        return "outline";
    }
  };
  return (
    <div>
      <PageHeader
        title={task.description}
        icon={ClipboardList}
        description={`Maintenance for: ${
          equipment ? `${equipment.name} (${equipment.model})` : "Equipment"
        }`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/maintenance">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Maintenance
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/maintenance/${task.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit Task
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the task "{task.description}".
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
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Equipment:</strong>{" "}
                  {equipment
                    ? `${equipment.name} (${equipment.model})`
                    : "Loading..."}
                </div>
                <div>
                  <strong>Serial Number:</strong>{" "}
                  {equipment?.serialNumber || "N/A"}
                </div>
                <div>
                  <strong>Location:</strong> {equipment?.location || "N/A"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <Badge
                    variant={getStatusBadgeVariant(task.status)}
                    className="capitalize"
                  >
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                {task.nextDueDate && (
                  <div>
                    <strong>Due Date:</strong>{" "}
                    <span
                      className={
                        new Date(task.nextDueDate) < new Date() &&
                        task.status !== "completed"
                          ? "text-destructive font-bold"
                          : ""
                      }
                    >
                      {new Date(task.nextDueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {task.lastPerformedDate && (
                  <div>
                    <strong>Last Performed:</strong>{" "}
                    {new Date(task.lastPerformedDate).toLocaleDateString()}
                  </div>
                )}
                {task.frequencyDays && (
                  <div>
                    <strong>Frequency:</strong> Every {task.frequencyDays} days
                  </div>
                )}
                {task.assignedTo && (
                  <div>
                    <strong>Assigned To:</strong> {task.assignedTo}
                  </div>
                )}
              </div>
              {task.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      Notes / Instructions:
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.notes}
                    </p>
                  </div>
                </>
              )}
              {task.partsUsed && task.partsUsed.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-semibold mb-1">Parts Used:</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {task.partsUsed.map((part, index) => (
                        <li key={index}>
                          {part.partName} (Quantity: {part.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {task.status !== "completed" && task.status !== "skipped" ? (
                <CompleteMaintenanceModal
                  task={task}
                  onCompleted={handleMaintenanceCompleted}
                />
              ) : (
                <Button disabled variant="outline">
                  <CheckSquare className="mr-2 h-4 w-4" /> Task Completed
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>
                Records of completed maintenance for this task.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Work Description
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Cost
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{record.performedBy}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {record.descriptionOfWork}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {record.cost ? `$${record.cost.toFixed(2)}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" asChild>
                            <Link
                              href={`/service-records/${record.id}`}
                              className="inline-flex items-center justify-center gap-2"
                            >
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No maintenance records found for this task.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Related Resources</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {equipment ? (
                <Button variant="link" asChild className="justify-start px-0">
                  <Link
                    href={`/equipment/${equipment.id}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    View Equipment Details
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="link"
                  asChild
                  disabled
                  className="justify-start px-0"
                >
                  View Equipment Details
                </Button>
              )}
            </CardContent>
          </Card>
          <RelatedDocuments
            objectId={task.id}
            title="Related Documents"
            description="Upload maintenance manuals, procedures, work instructions, and other task-related documents"
            defaultDocumentType="Maintenance Document"
            additionalTags={[
              "maintenance",
              "task",
              task.description?.toLowerCase().replace(/\s+/g, "-") ||
                "maintenance-task",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
