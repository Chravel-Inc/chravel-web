const fs = require('fs');
const file = 'src/components/mobile/MobileTripPayments.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import necessary Dialog components and formatters
const importsToAdd = `
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatShortDate } from '@/utils/dateFormatters';
`;
content = content.replace("import { formatCurrency } from '@/services/currencyService';", importsToAdd + "import { formatCurrency } from '@/services/currencyService';");

// 2. Add state for the detail modal
const stateToAdd = `
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
`;
content = content.replace("const [isModalOpen, setIsModalOpen] = useState(false);", stateToAdd);

// 3. Update handlePaymentTap
content = content.replace(
  "// TODO: Open payment detail modal for _paymentId",
  "setSelectedPaymentId(_paymentId);"
);

// 4. Find the selected payment for the modal
const logicToAdd = `
  const selectedPayment = useMemo(() => {
    if (!selectedPaymentId) return null;
    return effectivePayments.find(p => p.id === selectedPaymentId) || null;
  }, [selectedPaymentId, effectivePayments]);
`;
content = content.replace("const handleAddPayment = async () => {", logicToAdd + "\n  const handleAddPayment = async () => {");

// 5. Add the modal rendering inside the return block
const modalToAdd = `
      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPaymentId} onOpenChange={(open) => !open && setSelectedPaymentId(null)}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center space-y-2 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedPayment.payerAvatar} alt={selectedPayment.payer} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                    {getInitials(selectedPayment.payer)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-foreground text-center">
                  {selectedPayment.description}
                </h3>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrencyFn(selectedPayment.amount, selectedPayment.currency)}
                </p>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-full border border-border">
                  {getStatusIcon(selectedPayment.status)}
                  <span className={\`text-sm font-medium \${selectedPayment.isSettled ? 'text-green-500' : 'text-yellow-500'}\`}>
                    {selectedPayment.isSettled ? 'Settled' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 bg-card/50 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Paid by</span>
                  <span className="text-sm font-medium text-foreground">{selectedPayment.payer}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-medium text-foreground">{formatShortDate(selectedPayment.date)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Split</span>
                  <span className="text-sm font-medium text-foreground">{selectedPayment.splitCount} ways</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per person</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrencyFn(selectedPayment.amount / selectedPayment.splitCount, selectedPayment.currency)}
                  </span>
                </div>
              </div>

              {selectedPayment.splitWith && selectedPayment.splitWith.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Participants</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPayment.splitWith.map(userId => {
                      const member = effectiveTripMembers.find(m => m.id === userId);
                      return (
                        <div key={userId} className="flex items-center gap-2 bg-card/50 px-2.5 py-1.5 rounded-full border border-border">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={member?.avatar || getConsistentAvatar(member?.name || 'Unknown')} />
                            <AvatarFallback className="text-[10px]">{getInitials(member?.name || 'Unknown')}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{member?.name || 'Unknown'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;
content = content.replace("{/* Create Payment Modal */}", modalToAdd + "\n      {/* Create Payment Modal */}");

fs.writeFileSync(file, content);
console.log("Patched successfully");
