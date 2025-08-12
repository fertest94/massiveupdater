import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Check, AlertTriangle, Copy, Users, CheckSquare, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PreviewTableProps {
  sessionId: string;
  disabled?: boolean;
}

interface PreviewData {
  results: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PreviewTable({ sessionId, disabled }: PreviewTableProps) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();
  const token = new URLSearchParams(window.location.search).get('token');
  const domain = new URLSearchParams(window.location.search).get('domain');
  
  const { data: previewData, isLoading } = useQuery<PreviewData>({
    queryKey: [`/api/preview/${sessionId}?token=${token}&domain=${domain}&page=${page}&filter=${filter}&search=${search}`],
    enabled: !!sessionId && !disabled,
  });

  const updateRecordsMutation = useMutation({
    mutationFn: (updates: any[]) => apiRequest('PATCH', `/api/preview/${sessionId}?token=${token}&domain=${domain}`, { updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/preview/${sessionId}`] });
      toast({
        title: "Records updated",
        description: "Changes saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const results = previewData?.results || [];
  const pagination = previewData?.pagination || {};
  
  // Calculate summary stats
  const stats = {
    found: results.filter((r: any) => r.status === 'found').length,
    notFound: results.filter((r: any) => r.status === 'not_found').length,
    duplicates: results.filter((r: any) => r.status === 'duplicate').length,
    errors: results.filter((r: any) => r.status === 'error').length,
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === results.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(results.map((r: any) => r.id)));
    }
  };

  const handleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleRecordUpdate = (recordId: string, field: string, value: any) => {
    const updates = [{ id: recordId, data: { [field]: value } }];
    updateRecordsMutation.mutate(updates);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'found':
        return (
          <Badge className="status-ready" data-testid={`status-found`}>
            <Check className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case 'not_found':
        return (
          <Badge className="status-not-found" data-testid={`status-not-found`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Not Found
          </Badge>
        );
      case 'duplicate':
        return (
          <Badge className="status-duplicate" data-testid={`status-duplicate`}>
            <Copy className="w-3 h-3 mr-1" />
            Duplicate
          </Badge>
        );
      case 'error':
        return (
          <Badge className="status-error" data-testid={`status-error`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <section className="glassmorphism rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-apple-gray-800 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-apple-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`glassmorphism rounded-2xl p-8 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            disabled ? 'bg-apple-gray-700' : 'bg-apple-blue'
          }`}>
            <span className="text-white font-semibold">3</span>
          </div>
          <h2 className="text-xl font-semibold text-white">Preview Changes</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-green-400">
            <Check className="w-4 h-4 inline mr-1" />
            {stats.found} Found
          </span>
          <span className="text-red-400">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            {stats.notFound} Not Found
          </span>
          <span className="text-yellow-400">
            <Copy className="w-4 h-4 inline mr-1" />
            {stats.duplicates} Duplicates
          </span>
        </div>
      </div>
      
      {/* Filter and Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Select value={filter} onValueChange={setFilter} disabled={disabled}>
            <SelectTrigger className="w-40 bg-apple-gray-900 border-apple-gray-700" data-testid="select-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-apple-gray-900 border-apple-gray-700">
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="update">To Update</SelectItem>
              <SelectItem value="ignore">To Ignore</SelectItem>
              <SelectItem value="not_found">Not Found</SelectItem>
              <SelectItem value="duplicates">Duplicates</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray-400" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              className="pl-10 w-64 bg-apple-gray-900 border-apple-gray-700 text-white"
              data-testid="input-search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSelectAll}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="bg-apple-gray-800 border-apple-gray-700 text-white hover:bg-apple-gray-700"
            data-testid="button-select-all"
          >
            {selectedRecords.size === results.length ? (
              <CheckSquare className="w-4 h-4 mr-2" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            {selectedRecords.size === results.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>
      
      {/* Preview Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="border-apple-gray-800">
              <TableHead className="text-apple-gray-300">
                <Checkbox
                  checked={selectedRecords.size === results.length && results.length > 0}
                  onCheckedChange={handleSelectAll}
                  disabled={disabled}
                  data-testid="checkbox-select-all"
                />
              </TableHead>
              <TableHead className="text-apple-gray-300">ID</TableHead>
              <TableHead className="text-apple-gray-300">Search Key</TableHead>
              <TableHead className="text-apple-gray-300">Field</TableHead>
              <TableHead className="text-apple-gray-300">Current Value</TableHead>
              <TableHead className="text-apple-gray-300">New Value</TableHead>
              <TableHead className="text-apple-gray-300">Action</TableHead>
              <TableHead className="text-apple-gray-300">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((record: any) => (
              <TableRow 
                key={record.id} 
                className="table-row border-apple-gray-800/50"
                data-testid={`row-record-${record.id}`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.has(record.id)}
                    onCheckedChange={() => handleSelectRecord(record.id)}
                    disabled={disabled}
                    data-testid={`checkbox-record-${record.id}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm text-apple-blue">
                  {record.bitrixId || '-'}
                </TableCell>
                <TableCell className="text-sm text-white">
                  {record.searchKey}
                </TableCell>
                <TableCell className="text-sm text-white">
                  {record.field}
                </TableCell>
                <TableCell className="text-sm text-apple-gray-400">
                  {record.currentValue || '-'}
                </TableCell>
                <TableCell>
                  <Input
                    value={record.newValue}
                    onChange={(e) => handleRecordUpdate(record.id, 'newValue', e.target.value)}
                    disabled={disabled || record.status === 'not_found'}
                    className="bg-apple-gray-900 border-apple-gray-700 text-white text-sm"
                    data-testid={`input-new-value-${record.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={record.action}
                    onValueChange={(value) => handleRecordUpdate(record.id, 'action', value)}
                    disabled={disabled || record.status === 'not_found'}
                  >
                    <SelectTrigger className="bg-apple-gray-900 border-apple-gray-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-apple-gray-900 border-apple-gray-700">
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="ignore">Ignore</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {getStatusBadge(record.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-apple-gray-800">
        <p className="text-sm text-apple-gray-400" data-testid="pagination-info">
          Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
        </p>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={disabled || page <= 1}
            variant="outline"
            size="sm"
            className="bg-apple-gray-800 border-apple-gray-700 text-white hover:bg-apple-gray-700"
            data-testid="button-previous-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="px-3 py-1 bg-apple-blue text-white rounded-lg text-sm">
            {pagination.page}
          </span>
          
          <Button
            onClick={() => setPage(page + 1)}
            disabled={disabled || page >= pagination.totalPages}
            variant="outline"
            size="sm"
            className="bg-apple-gray-800 border-apple-gray-700 text-white hover:bg-apple-gray-700"
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
