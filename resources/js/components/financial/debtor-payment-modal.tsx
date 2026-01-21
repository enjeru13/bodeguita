import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { Banknote, Info } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Debtor {
    customer_id: number;
    customer_name: string;
    total_debt_cop: number;
    total_debt_usd: number;
    sale_count: number;
}

interface DebtorPaymentModalProps {
    debtor: Debtor | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DebtorPaymentModal({
    debtor,
    isOpen,
    onClose,
}: DebtorPaymentModalProps) {
    const { data, setData, post, processing, reset } = useForm({
        amount: '',
        currency: 'COP' as 'COP' | 'USD' | 'VES',
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!debtor) return;

        if (!data.amount || parseFloat(data.amount) <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }

        post(`/sales/customer/${debtor.customer_id}/pay-debt`, {
            onSuccess: () => {
                toast.success('Pago procesado correctamente');
                onClose();
            },
            onError: (errors) => {
                const errorMessage =
                    errors.amount || errors.currency || 'Error al procesar el pago';
                toast.error(errorMessage);
            },
        });
    };

    const handlePayFull = () => {
        const fullAmount =
            data.currency === 'COP'
                ? debtor?.total_debt_cop
                : debtor?.total_debt_usd;
        setData('amount', fullAmount?.toString() || '');
    };

    const formatCurrency = (amount: number, currency: 'COP' | 'USD') => {
        if (currency === 'USD') {
            return `$${amount.toFixed(2)}`;
        }
        return amount.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    };

    if (!debtor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        Abonar Deuda de Cliente
                    </DialogTitle>
                    <DialogDescription>
                        Registra un pago para <strong>{debtor.customer_name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 py-4">
                        {/* Información de la deuda */}
                        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-400">
                                <Info className="h-4 w-4" />
                                Deuda Total
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Pesos (COP)
                                    </div>
                                    <div className="text-lg font-black text-orange-700 dark:text-orange-400">
                                        {formatCurrency(debtor.total_debt_cop, 'COP')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Dólares (USD)
                                    </div>
                                    <div className="text-lg font-black text-orange-700 dark:text-orange-400">
                                        {formatCurrency(debtor.total_debt_usd, 'USD')}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                {debtor.sale_count} venta(s) pendiente(s)
                            </div>
                        </div>

                        {/* Selector de moneda */}
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda de Pago</Label>
                            <Select
                                value={data.currency}
                                onValueChange={(value) =>
                                    setData('currency', value as 'COP' | 'USD' | 'VES')
                                }
                            >
                                <SelectTrigger id="currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COP">Pesos Colombianos (COP)</SelectItem>
                                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                                    <SelectItem value="VES">Bolívares (VES)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Monto a pagar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="amount">Monto a Pagar</Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs"
                                    onClick={handlePayFull}
                                >
                                    Pagar Deuda Completa
                                </Button>
                            </div>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="text-lg font-bold"
                            />
                        </div>

                        {/* Mensaje informativo */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400">
                            <Info className="mb-1 inline h-3.5 w-3.5" /> El pago se distribuirá
                            automáticamente entre las ventas más antiguas primero.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.amount}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {processing ? 'Procesando...' : 'Confirmar Pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
