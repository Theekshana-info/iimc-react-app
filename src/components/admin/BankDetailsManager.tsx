import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function BankDetailsManager() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const { data: bankDetails, isLoading } = useQuery({
    queryKey: ['admin-bank-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('bank_details').insert({
        bank_name: bankName,
        branch_name: branchName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bank-details'] });
      queryClient.invalidateQueries({ queryKey: ['bank-details'] });
      toast.success('Bank details added successfully');
      setBankName('');
      setBranchName('');
      setAccountNumber('');
      setAccountHolderName('');
      setIsAdding(false);
    },
    onError: (error) => {
      console.error('Error adding bank details:', error);
      toast.error('Failed to add bank details');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bank-details'] });
      queryClient.invalidateQueries({ queryKey: ['bank-details'] });
      toast.success('Bank details deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting bank details:', error);
      toast.error('Failed to delete bank details');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('bank_details')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bank-details'] });
      queryClient.invalidateQueries({ queryKey: ['bank-details'] });
      toast.success('Bank details updated');
    },
    onError: (error) => {
      console.error('Error updating bank details:', error);
      toast.error('Failed to update bank details');
    },
  });

  const handleAdd = () => {
    if (!bankName || !branchName || !accountNumber || !accountHolderName) {
      toast.error('Please fill in all fields');
      return;
    }
    addMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Details Management</h2>
          <p className="text-muted-foreground">Manage bank accounts for direct donations</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Bank Account</CardTitle>
            <CardDescription>Enter the bank account details for donations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name *</Label>
                <Input
                  id="bank-name"
                  placeholder="e.g., Bank of Ceylon"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-name">Branch Name *</Label>
                <Input
                  id="branch-name"
                  placeholder="e.g., Colombo Main Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number *</Label>
                <Input
                  id="account-number"
                  placeholder="e.g., 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-holder">Account Holder Name *</Label>
                <Input
                  id="account-holder"
                  placeholder="e.g., IIMC Foundation"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setBankName('');
                  setBranchName('');
                  setAccountNumber('');
                  setAccountHolderName('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding...' : 'Add Bank Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>Manage existing bank account details</CardDescription>
        </CardHeader>
        <CardContent>
          {bankDetails && bankDetails.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankDetails.map((bank) => (
                  <TableRow key={bank.id}>
                    <TableCell className="font-medium">{bank.bank_name}</TableCell>
                    <TableCell>{bank.branch_name}</TableCell>
                    <TableCell className="font-mono">{bank.account_number}</TableCell>
                    <TableCell>{bank.account_holder_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={bank.is_active}
                          onCheckedChange={() =>
                            toggleActiveMutation.mutate({
                              id: bank.id,
                              isActive: bank.is_active,
                            })
                          }
                        />
                        {bank.is_active ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(bank.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No bank accounts added yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
