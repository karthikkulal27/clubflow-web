import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { addIncome, getIncome, deleteIncome } from '../lib/income.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { queryClient } from '../lib/queryClient';

const INCOME_CATEGORIES = [
  'Opening Balance',
  'Donation',
  'Sponsorship',
  'Event Revenue',
  'Other',
];

export default function IncomePage() {
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: incomeEntries = [], isLoading } = useQuery({
    queryKey: ['income'],
    queryFn: () => getIncome(),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => addIncome(data),
    onSuccess: () => {
      setAmount('');
      setDescription('');
      setCategory(INCOME_CATEGORIES[0]);
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    addMutation.mutate({
      category,
      amount: Number(amount),
      description: description || undefined,
    });
  };

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '10px' }}>💰 Club Income Management</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Add income sources like opening balance, donations, and sponsorships. All members will be notified.
      </p>

      {/* Add Income Form */}
      <div style={{ marginBottom: '30px' }}>
        <Card>
          <h2 style={{ marginBottom: '20px' }}>Add Income Entry</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Description (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., XYZ Corporation Sponsorship"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={addMutation.isPending}
              style={{ marginTop: '10px' }}
            >
              {addMutation.isPending ? 'Adding...' : '✓ Add Income'}
            </Button>

            <div
              style={{
                fontSize: '0.85em',
                color: '#666',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginTop: '10px',
              }}
            >
              ℹ️ All active members will receive a notification about this income entry.
            </div>
          </div>
        </form>
        </Card>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '30px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.9em', color: '#666', margin: '0 0 8px 0' }}>
                Total Admin Income
              </p>
              <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0, color: '#667eea' }}>
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p style={{ fontSize: '0.85em', color: '#999' }}>
              {incomeEntries.length} entries
          </p>
        </div>
      </Card>

      {/* Income Entries List */}
      <Card>
        <h2 style={{ marginBottom: '20px' }}>Income History</h2>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>
        ) : incomeEntries.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No income entries yet. Add the first one above!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Category
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                    Amount
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Added By
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                    Description
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {incomeEntries.map((income) => (
                  <tr key={income.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(income.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '12px' }}>{income.category}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#667eea' }}>
                      ₹{Number(income.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px' }}>{income.admin.name}</td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '0.9em' }}>
                      {income.description || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this income entry?')) {
                            deleteMutation.mutate(income.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
