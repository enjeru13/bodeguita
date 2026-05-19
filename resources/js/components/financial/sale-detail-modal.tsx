import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Banknote,
    Calculator,
    Calendar,
    Package,
    Receipt,
    User,
} from 'lucide-react';

interface SaleItem {
    id: number;
    product: {
        name: string;
    };
    quantity: number;
    price_usd: number;
    subtotal_usd: number;
}

interface Payment {
    id: number;
    amount: number;
    currency: 'COP' | 'VES' | 'USD';
    created_at: string;
}

interface Sale {
    id: number;
    customer: {
        name: string;
    } | null;
    total_usd: number;
    total_ves: number;
    total_cop: number;
    paid_amount_usd: number;
    paid_amount_ves: number;
    paid_amount_cop: number;
    exchange_rate_ves: number;
    exchange_rate_cop: number;
    status: string;
    created_at: string;
    items: SaleItem[];
    payments?: Payment[];
}

interface Props {
    sale: Sale | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SaleDetailModal({ sale, isOpen, onClose }: Props) {
    if (!sale) return null;

    const formatCurrency = (
        amount: number,
        currency: 'COP' | 'VES' | 'USD',
    ) => {
        if (currency === 'USD') {
            return `$${Number(amount).toFixed(2)}`;
        }
        return Number(amount).toLocaleString('es-CO', {
            maximumFractionDigits: 0,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[600px]">
                <DialogHeader className="p-6 pb-0">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-zinc-100 p-2.5 dark:bg-zinc-800">
                                <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">
                                    Detalle de Orden
                                </DialogTitle>
                                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                                    Venta #{sale.id}
                                </p>
                            </div>
                        </div>
                        <Badge
                            className={
                                sale.status === 'pending'
                                    ? 'border-none bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-700 uppercase hover:bg-orange-100'
                                    : 'border-none bg-green-100 px-3 py-1 text-[10px] font-black text-green-700 uppercase hover:bg-green-100'
                            }
                        >
                            {sale.status === 'pending' ? 'Pendiente' : 'Pagado'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-dashed border-zinc-200 py-4 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase">
                                    Fecha y Hora
                                </span>
                                <span className="text-xs font-bold">
                                    {new Date(sale.created_at).toLocaleString(
                                        'es-ES',
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase">
                                    Cliente
                                </span>
                                <span className="text-xs font-bold">
                                    {sale.customer?.name || 'Cliente Eventual'}
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 pt-4">
                    <div className="mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-sm font-black tracking-widest text-zinc-800 uppercase dark:text-zinc-200">
                            Productos
                        </h3>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                                    <th className="px-4 py-2.5 text-left text-[10px] font-black tracking-wider text-zinc-400 uppercase">
                                        Producto
                                    </th>
                                    <th className="px-4 py-2.5 text-center text-[10px] font-black tracking-wider text-zinc-400 uppercase">
                                        Cant.
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-[10px] font-black tracking-wider text-zinc-400 uppercase">
                                        Precio
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-[10px] font-black tracking-wider text-zinc-400 uppercase">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {sale.items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                    >
                                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                                            {item.product.name}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-zinc-500">
                                            x{item.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-zinc-600 dark:text-zinc-400">
                                            {formatCurrency(
                                                item.price_usd,
                                                'USD',
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-zinc-900 dark:text-zinc-50">
                                            {formatCurrency(
                                                item.subtotal_usd,
                                                'USD',
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                        <div className="mb-1 flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                                Resumen Total
                            </h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-400 uppercase">
                                    Total Pesos
                                </span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(sale.total_cop, 'COP')}{' '}
                                    <span className="text-[10px]">COP</span>
                                </span>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-[9px] font-black text-zinc-400 uppercase">
                                    Referencia
                                </span>
                                <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                    {formatCurrency(sale.total_usd, 'USD')}{' '}
                                    <span className="text-[10px]">USD</span>
                                </span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[9px] font-black text-zinc-400 uppercase">
                                    Total Bolívares
                                </span>
                                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                                    {formatCurrency(sale.total_ves, 'VES')}{' '}
                                    <span className="text-[10px]">VES</span>
                                </span>
                            </div>
                        </div>

                        {sale.status === 'pending' && (
                            <div className="flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-700">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-orange-400 uppercase">
                                        Deuda Pendiente
                                    </span>
                                    <span className="text-sm font-black text-orange-600 uppercase">
                                        {formatCurrency(
                                            sale.total_cop -
                                                sale.paid_amount_cop,
                                            'COP',
                                        )}{' '}
                                        COP
                                    </span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black text-green-400 uppercase">
                                        Abonado
                                    </span>
                                    <span className="text-sm font-black text-green-600 uppercase">
                                        {formatCurrency(
                                            sale.paid_amount_cop,
                                            'COP',
                                        )}{' '}
                                        COP
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Historial de Pagos */}
                    <div className="mt-6">
                        <div className="mb-3 flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-black tracking-widest text-zinc-800 uppercase dark:text-zinc-200">
                                Historial de Pagos
                            </h3>
                        </div>

                        <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-1">
                            {sale.payments && sale.payments.length > 0 ? (
                                sale.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase">
                                                {new Date(
                                                    payment.created_at,
                                                ).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <span className="text-xs font-bold text-zinc-500">
                                                Abono en {payment.currency}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-emerald-600">
                                                +{' '}
                                                {formatCurrency(
                                                    payment.amount,
                                                    payment.currency,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-[10px] font-bold text-zinc-400 uppercase italic dark:border-zinc-800">
                                    No hay abonos registrados para esta venta
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
                    <Button
                        onClick={onClose}
                        className="h-10 rounded-xl px-8 text-xs font-black tracking-widest uppercase"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
