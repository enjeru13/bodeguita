/* eslint-disable react-hooks/exhaustive-deps */
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
import { Banknote } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Definimos la interfaz parcial que necesitamos de la venta
interface Sale {
    id: number;
    total_cop: number;
    paid_amount_cop: number;
    total_usd: number;
    paid_amount_usd: number;
    customer: { name: string } | null;
}

interface Props {
    sale: Sale | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DebtPaymentModal({ sale, isOpen, onClose }: Props) {
    const {
        data,
        setData,
        post,
        processing,
        reset,
        wasSuccessful,
        clearErrors,
    } = useForm({
        amount: '',
        currency: 'COP', // Por defecto cobramos en Pesos
    });

    // Resetear formulario cuando se cierra o se completa
    useEffect(() => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
    }, [isOpen]);

    useEffect(() => {
        if (wasSuccessful) {
            onClose();
            toast.success('Abono registrado correctamente');
        }
    }, [wasSuccessful]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sale) return;

        // Asumiendo que tienes esta ruta en Laravel
        post(`/sales/${sale.id}/payment`, {
            preserveScroll: true,
            onError: () => toast.error('Error al registrar el abono'),
        });
    };

    if (!sale) return null;

    // Calcular deuda restante para mostrarla visualmente
    const debtCOP = sale.total_cop - sale.paid_amount_cop;
    const debtUSD = sale.total_usd - sale.paid_amount_usd;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <Banknote className="h-5 w-5" />
                        Registrar Abono
                    </DialogTitle>
                    <DialogDescription>
                        Venta #{sale.id} -{' '}
                        <span className="font-bold text-foreground">
                            {sale.customer?.name || 'Cliente Eventual'}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* Resumen de Deuda */}
                <div className="my-2 rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-800/50 dark:bg-orange-900/20">
                    <p className="mb-2 text-xs font-bold tracking-wider text-orange-800 uppercase dark:text-orange-300">
                        Saldo Pendiente
                    </p>
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
                                ${debtCOP.toLocaleString('es-CO')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                                PESOS (COP)
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                                ${debtUSD.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                                DÓLARES (USD)
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="currency">Moneda de Pago</Label>
                        <Select
                            value={data.currency}
                            onValueChange={(val) => setData('currency', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="COP">
                                    Pesos Colombianos (COP)
                                </SelectItem>
                                <SelectItem value="USD">
                                    Dólares (USD)
                                </SelectItem>
                                <SelectItem value="VES">
                                    Bolívares (VES)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Monto a Abonar</Label>
                        <Input
                            id="amount"
                            type="number"
                            step={data.currency === 'COP' ? '1' : '0.01'}
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            placeholder="Ingrese cantidad..."
                            className="text-lg font-bold"
                            autoFocus
                        />
                    </div>

                    <DialogFooter className="mt-2 gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.amount}
                            className="bg-orange-600 font-bold text-white hover:bg-orange-700"
                        >
                            {processing ? 'Procesando...' : 'Confirmar Pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
