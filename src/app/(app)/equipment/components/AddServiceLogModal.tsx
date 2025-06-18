"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import ServiceLogForm from "./ServiceLogForm";

interface AddServiceLogModalProps {
  equipmentId: string;
  equipmentName: string;
  onServiceLogAdded: () => void;
}

export default function AddServiceLogModal({
  equipmentId,
  equipmentName,
  onServiceLogAdded,
}: AddServiceLogModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    onServiceLogAdded();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Wrench className="h-4 w-4" />
          Add Service Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Service Log for {equipmentName}</DialogTitle>
          <DialogDescription>
            Record service work performed on this equipment that is not part of
            a scheduled maintenance task.
          </DialogDescription>
        </DialogHeader>
        <ServiceLogForm
          equipmentId={equipmentId}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  );
}
