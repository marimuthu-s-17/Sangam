import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Box,
  Typography,
  TableSortLabel
} from '@mui/material';

export default function ReusableTable({
  columns,
  data,
  loading = false,
  // Server-side pagination props
  pageCount = -1,
  pagination = undefined, // { pageIndex: 0, pageSize: 10 }
  onPaginationChange = undefined,
  // Server-side sorting props
  sorting = undefined,
  onSortingChange = undefined,
  totalItems = 0,
  hidePagination = false,
}) {
  const isServerSide = !!onPaginationChange;

  const table = useReactTable({
    data,
    columns,
    state: {
      ...(pagination ? { pagination } : {}),
      ...(sorting ? { sorting } : {}),
    },
    onPaginationChange: onPaginationChange,
    onSortingChange: onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    // Client-side models if not server-side
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: onSortingChange ? undefined : getSortedRowModel(),
    manualPagination: isServerSide,
    manualSorting: !!onSortingChange,
    pageCount: isServerSide ? pageCount : undefined,
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell
                    key={header.id}
                    align={header.column.columnDef.meta?.align || 'left'}
                    sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: 'background.paper' }}
                  >
                    {header.isPlaceholder ? null : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: header.column.columnDef.meta?.align === 'right' ? 'flex-end' :
                                         header.column.columnDef.meta?.align === 'center' ? 'center' : 'flex-start',
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <TableSortLabel
                            active={header.column.getIsSorted() !== false}
                            direction={header.column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, idx) => (
                <TableRow key={idx}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} hover>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} align={cell.column.columnDef.meta?.align || 'left'}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!hidePagination && (
        <TablePagination
          component="div"
          count={isServerSide ? totalItems : table.getPrePaginationRowModel().rows.length}
          page={table.getState().pagination.pageIndex}
          onPageChange={(e, newPage) => table.setPageIndex(newPage)}
          rowsPerPage={table.getState().pagination.pageSize}
          onRowsPerPageChange={(e) => table.setPageSize(Number(e.target.value))}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </Paper>
  );
}
