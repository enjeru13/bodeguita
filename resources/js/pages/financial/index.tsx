import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowUpRight,
    Clock,
    History as HistoryIcon,
    LayoutDashboard,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Importado
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Importado

interface ExchangeRate {
    id: number;
    currency_code: string;
    rate: number;
}

interface SaleItem {
    id: number;
    product: {
        name: string;
    };
    quantity: number;
    price_usd: number;
    subtotal_usd: number;
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
    status: string;
    created_at: string;
    items: SaleItem[];
}

interface Debtor {
    customer_id: number;
    customer_name: string;
    total_debt_cop: number;
    total_debt_usd: number;
    sale_count: number;
}

interface Summary {
    total_usd: number;
    total_cop: number;
    total_ves: number;
    total_sales: number;
    today_sales: number;
    today_total_usd: number;
    today_total_cop: number;
    today_total_ves: number;
    total_paid_cop: number;
    total_paid_usd: number;
    total_debt_cop: number;
    total_debt_usd: number;
    net_worth_cop: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Control Financiero',
        href: '/financial',
    },
];

export default function FinancialIndex({
    sales,
    exchangeRates,
    summary,
    debtors,
}: {
    sales: Sale[];
    exchangeRates: ExchangeRate[];
    summary: Summary;
    debtors: Debtor[];
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'sales' | 'debtors'>('sales');

    // Exchange rates form
    const { data, setData, post, processing } = useForm({
        rates: exchangeRates.map((r) => ({
            currency_code: r.currency_code,
            rate: r.rate,
        })),
        freeze_cop_prices: false, // Nuevo estado para el checkbox
    });

    const handleRateChange = (code: string, value: string) => {
        const newRates = data.rates.map((r) =>
            r.currency_code === code
                ? { ...r, rate: parseFloat(value) || 0 }
                : r,
        );
        setData('rates', newRates);
    };

    const submitRates = (e: React.FormEvent) => {
        e.preventDefault();
        post('/exchange-rates', {
            onSuccess: () => toast.success('Tasas de cambio actualizadas'),
            onError: () => toast.error('Error al actualizar las tasas'),
        });
    };

    const filteredSales = sales.filter((sale) => {
        const customerName = sale.customer?.name || 'cliente eventual';
        const matchesCustomer = customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesId = sale.id.toString().includes(searchTerm);
        return matchesCustomer || matchesId;
    });

    // Helper para formatear moneda sin decimales (COP/VES)
    const formatCurrency = (
        amount: number,
        currency: 'COP' | 'VES' | 'USD',
    ) => {
        if (currency === 'USD') {
            return `$${Number(amount).toFixed(2)}`;
        }
        // Para COP y VES quitamos los decimales
        return Number(amount).toLocaleString('es-CO', {
            maximumFractionDigits: 0,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Financiero" />

            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header Section Responsivo */}
                <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                            Control Financiero
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestión de ingresos, deudas y tasas de cambio en
                            tiempo real.
                        </p>
                    </div>

                    {/* Formulario de Tasas Ajustado para Móvil */}
                    <div className="w-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 xl:w-auto dark:border-zinc-800 dark:bg-zinc-900/50">
                        <form
                            onSubmit={submitRates}
                            className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6"
                        >
                            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 md:border-r md:border-b-0 md:pr-4 md:pb-0 dark:border-zinc-800">
                                <RefreshCw className="animate-spin-slow h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                                    Tasas de Cambio
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
                                {data.rates.map((rate) => (
                                    <div
                                        key={rate.currency_code}
                                        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
                                    >
                                        <span className="text-[10px] font-black text-zinc-400 uppercase dark:text-zinc-500">
                                            {rate.currency_code}:
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={rate.rate}
                                            onChange={(e) =>
                                                handleRateChange(
                                                    rate.currency_code,
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 w-full rounded-md border-none bg-white p-1 px-2 font-mono text-sm font-bold text-zinc-900 focus:ring-1 focus:ring-indigo-500 sm:w-20 dark:bg-zinc-800/50 dark:text-zinc-100"
                                        />
                                    </div>
                                ))}

                                {/* Checkbox para congelar precios */}
                                <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:w-auto">
                                    <Checkbox
                                        id="freeze"
                                        checked={data.freeze_cop_prices}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'freeze_cop_prices',
                                                !!checked,
                                            )
                                        }
                                        className="border-zinc-300 data-[state=checked]:bg-indigo-600 dark:border-zinc-600"
                                    />
                                    <Label
                                        htmlFor="freeze"
                                        className="cursor-pointer text-[9px] font-bold tracking-widest text-muted-foreground uppercase select-none"
                                    >
                                        Fijar COP
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                    className="col-span-2 h-8 w-full text-[10px] font-bold tracking-widest uppercase sm:col-span-1 sm:w-auto"
                                >
                                    Actualizar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Dashboard Cards - REORGANIZED */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Patrimony / Net Worth - HIGHLIGHTED */}
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black tracking-widest text-indigo-200 uppercase opacity-80">
                                PATRIMONIO TOTAL (COP)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-black tracking-tight">
                                {formatCurrency(summary.net_worth_cop, 'COP')}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-indigo-100 opacity-90">
                                <Wallet className="h-3 w-3" />
                                <span>Caja + Cuentas por Cobrar</span>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp size={100} />
                        </div>
                    </Card>

                    {/* Pending Debts */}
                    <Card className="border-l-4 border-none border-l-orange-500 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-orange-600 uppercase dark:text-orange-400">
                                Por Cobrar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                    {formatCurrency(
                                        summary.total_debt_cop,
                                        'COP',
                                    )}
                                </span>
                                <span className="text-xs font-bold tracking-tighter text-muted-foreground">
                                    COP
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-500">
                                <Clock className="h-3 w-3 text-orange-500" />
                                <span>
                                    Ref:{' '}
                                    {formatCurrency(
                                        summary.total_debt_usd,
                                        'USD',
                                    )}{' '}
                                    USD
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today Revenue */}
                    <Card className="border-l-4 border-none border-l-green-500 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-green-600 uppercase dark:text-green-400">
                                Ingresos Hoy (COP)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-green-700 dark:text-green-400">
                                    {formatCurrency(
                                        summary.today_total_cop,
                                        'COP',
                                    )}
                                </span>
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="mt-1 text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
                                {summary.today_sales} ventas registradas
                            </p>
                        </CardContent>
                    </Card>

                    {/* Other Today Ref */}
                    <Card className="border-none bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                Ingresos Hoy (VES/USD)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                    Bs.{' '}
                                    {formatCurrency(
                                        summary.today_total_ves,
                                        'VES',
                                    )}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    VES
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    {formatCurrency(
                                        summary.today_total_usd,
                                        'USD',
                                    )}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    USD
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-4 flex flex-col gap-6">
                    {/* Tab Switcher */}
                    <div className="mx-auto flex w-fit items-center gap-1 rounded-2xl bg-zinc-100 p-1.5 shadow-inner lg:mx-0 dark:bg-zinc-800/50">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all',
                                activeTab === 'sales'
                                    ? 'scale-[1.02] bg-white text-zinc-900 shadow-md dark:bg-zinc-700 dark:text-zinc-50'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <HistoryIcon className="h-3.5 w-3.5" />
                            Historial
                        </button>
                        <button
                            onClick={() => setActiveTab('debtors')}
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all',
                                activeTab === 'debtors'
                                    ? 'scale-[1.02] bg-white text-orange-600 shadow-md dark:bg-zinc-700 dark:text-orange-400'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Deudores
                            {debtors.length > 0 && (
                                <Badge className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full border-none bg-orange-500 text-[9px] font-black text-white hover:bg-orange-600">
                                    {debtors.length}
                                </Badge>
                            )}
                        </button>
                    </div>

                    {activeTab === 'sales' ? (
                        <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-xl dark:bg-zinc-900">
                            <CardHeader className="flex flex-col items-center justify-between space-y-4 border-b bg-zinc-50/30 p-6 md:flex-row md:space-y-0 dark:bg-zinc-800/10">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black tracking-tight">
                                        Registro de Transacciones
                                    </CardTitle>
                                    <p className="text-xs font-medium tracking-tight text-muted-foreground uppercase">
                                        Listado detallado de movimientos
                                    </p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar por cliente o ID..."
                                        className="h-11 rounded-xl border-dashed bg-white pl-10 text-sm transition-all focus-visible:ring-indigo-500/30 dark:bg-zinc-800"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead>
                                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                                <th className="h-12 px-6 text-left text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Estado / Identificador
                                                </th>
                                                <th className="h-12 px-6 text-left text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Cliente & Cronología
                                                </th>
                                                <th className="h-12 px-6 text-left text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Detalle Items
                                                </th>
                                                <th className="h-12 px-6 text-right text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Total Pesos (COP)
                                                </th>
                                                <th className="h-12 px-6 text-right text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Cruce Moneda (Ref)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                                            {filteredSales.map((sale) => (
                                                <tr
                                                    key={sale.id}
                                                    className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="font-mono text-[10px] font-black text-zinc-400">
                                                                #{sale.id}
                                                            </span>
                                                            {sale.status ===
                                                            'pending' ? (
                                                                <Badge className="h-4 w-fit border-none bg-orange-100 px-1.5 text-[8px] font-black text-orange-700 uppercase dark:bg-orange-900/30 dark:text-orange-400">
                                                                    Crédito
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="h-4 w-fit border-none bg-green-100 px-1.5 text-center text-[8px] font-black text-green-700 uppercase dark:bg-green-900/30 dark:text-green-400">
                                                                    Pagado
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-50">
                                                            {sale.customer
                                                                ?.name ||
                                                                'Cliente Eventual'}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                                                            {new Date(
                                                                sale.created_at,
                                                            ).toLocaleString(
                                                                'es-ES',
                                                                {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="max-w-[240px] truncate text-[11px] leading-relaxed text-muted-foreground">
                                                            {sale.items
                                                                .map(
                                                                    (i) =>
                                                                        `${i.quantity}x ${i.product.name}`,
                                                                )
                                                                .join(', ')}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                                            {formatCurrency(
                                                                sale.total_cop,
                                                                'COP',
                                                            )}
                                                        </div>
                                                        {sale.status ===
                                                            'pending' && (
                                                            <div className="mt-1 flex flex-col items-end gap-0.5 border-t border-dotted pt-1">
                                                                <div className="text-[9px] font-bold tracking-tighter text-green-600 uppercase">
                                                                    Abonado:{' '}
                                                                    {formatCurrency(
                                                                        sale.paid_amount_cop,
                                                                        'COP',
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] font-black tracking-tighter text-destructive uppercase">
                                                                    Deuda:{' '}
                                                                    {formatCurrency(
                                                                        sale.total_cop -
                                                                            sale.paid_amount_cop,
                                                                        'COP',
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                            {formatCurrency(
                                                                sale.total_usd,
                                                                'USD',
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-[10px] font-bold text-blue-600/70 dark:text-blue-500/70">
                                                            Bs.{' '}
                                                            {formatCurrency(
                                                                sale.total_ves,
                                                                'VES',
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredSales.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="p-16 text-center text-muted-foreground italic"
                                                    >
                                                        <LayoutDashboard className="mx-auto mb-4 h-12 w-12 opacity-10" />
                                                        <p>
                                                            No se encontraron
                                                            registros de ventas.
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="overflow-hidden border-none bg-white shadow-xl dark:bg-zinc-900">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-lg font-bold text-orange-700 dark:text-orange-400">
                                    Cuentas por Cobrar
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Listado de deudas pendientes agrupadas por
                                    cliente.
                                </p>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto text-sm">
                                    <table className="w-full min-w-[500px]">
                                        <thead>
                                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                                <th className="h-12 px-6 text-left text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Cliente Deudor
                                                </th>
                                                <th className="h-12 px-6 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Movimientos
                                                </th>
                                                <th className="h-12 px-6 text-right text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Saldo Pendiente (COP)
                                                </th>
                                                <th className="h-12 px-6 text-right text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                                    Monto Ref. (USD)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {debtors.map((debtor) => (
                                                <tr
                                                    key={debtor.customer_id}
                                                    className="transition-colors hover:bg-orange-50/20"
                                                >
                                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                                                        {debtor.customer_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge
                                                            variant="secondary"
                                                            className="font-mono"
                                                        >
                                                            {debtor.sale_count}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-mono text-lg font-black text-orange-700 dark:text-orange-400">
                                                            {formatCurrency(
                                                                debtor.total_debt_cop,
                                                                'COP',
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-zinc-500">
                                                        {formatCurrency(
                                                            debtor.total_debt_usd,
                                                            'USD',
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {debtors.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="p-16 text-center text-muted-foreground italic"
                                                    >
                                                        <Users className="mx-auto mb-4 h-12 w-12 opacity-10" />
                                                        <p>
                                                            No hay deudas
                                                            pendientes
                                                            actualmente. ¡Todo
                                                            al día!
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
