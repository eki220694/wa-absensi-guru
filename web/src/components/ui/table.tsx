"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"table"> & { density?: "default" | "compact" }) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto rounded-lg ring-1 ring-foreground/5",
        "shadow-sm",
        className,
      )}
    >
      <table
        data-slot="table"
        data-density={density}
        className={cn(
          "w-full caption-bottom text-sm",
          "[&_[data-slot=table-head]]:h-10 [&_[data-slot=table-head]]:px-3 [&_[data-slot=table-head]]:text-left [&_[data-slot=table-head]]:align-middle [&_[data-slot=table-head]]:font-semibold [&_[data-slot=table-head]]:whitespace-nowrap [&_[data-slot=table-head]]:text-muted-foreground [&_[data-slot=table-head]]:uppercase [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:tracking-wide",
          "[&_[data-slot=table-cell]]:p-3 [&_[data-slot=table-cell]]:align-middle [&_[data-slot=table-cell]]:whitespace-nowrap",
          "[data-density=compact]_[data-slot=table-head]]:h-9 [&[data-density=compact]_[data-slot=table-head]]:px-2.5",
          "[data-density=compact]_[data-slot=table-cell]]:p-2",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "sticky top-0 z-10 bg-muted/30 backdrop-blur-sm [&_tr]:border-b",
        className,
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors duration-150 ease-out hover:bg-muted/40 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
