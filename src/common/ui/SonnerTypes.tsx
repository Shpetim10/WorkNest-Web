"use client"

import { toast } from "sonner"
import { Button } from "@/common/ui"

export function SonnerTypes() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button variant="secondary" onClick={() => toast("Event has been created")}>
        Default
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.success("Event has been created")}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.info("Be at the area 10 minutes before the event time")
        }
      >
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.warning("Event start time cannot be earlier than 8am")
        }
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.error("Event has not been created")}
      >
        Error
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          toast.promise<{ name: string }>(
            () =>
              new Promise((resolve) =>
                setTimeout(() => resolve({ name: "Event" }), 2000)
              ),
            {
              loading: "Loading...",
              success: (data) => `${data.name} has been created`,
              error: "Error",
            }
          )
        }}
      >
        Promise
      </Button>
    </div>
  )
}
