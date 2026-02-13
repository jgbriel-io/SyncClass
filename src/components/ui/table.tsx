import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full min-w-0 overflow-x-auto overflow-y-visible">
      <table 
        ref={ref} 
        className={cn(
          "w-auto min-w-max caption-bottom text-xs border-separate border-spacing-0",
          className
        )} 
        {...props} 
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead 
      ref={ref} 
      className={cn(
        "sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )} 
      {...props} 
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot 
      ref={ref} 
      className={cn(
        "border-t bg-muted/30 font-medium [&>tr]:last:border-b-0",
        className
      )} 
      {...props} 
    />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "group transition-all duration-200 border-b border-border/40",
        "hover:bg-accent/50 hover:shadow-sm data-[state=selected]:bg-muted/80",
        "last:border-b-0",
        className
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-14 mobile:h-12 tablet:h-12 laptop:h-12",
              "px-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2",
        "text-left align-middle",
        "text-xs",
        "font-semibold text-foreground/80",
        "border-b-2 border-border/60",
        "bg-muted/20",
        "[&:has([role=checkbox])]:pr-0",
        "whitespace-nowrap",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td 
      ref={ref} 
      className={cn(
        "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2",
        "align-middle",
        "text-xs",
        "[&:has([role=checkbox])]:pr-0",
        className
      )} 
      {...props} 
    />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
