import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    TrendingUp,
    RefreshCw,
    Search,
    History as HistoryIcon,
    Users,
    Wallet,
    ArrowUpRight,
    LayoutDashboard,
    Clock
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    debtors
}: {
    sales: Sale[],
    exchangeRates: ExchangeRate[],
    summary: Summary,
    debtors: Debtor[]
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'sales' | 'debtors'>('sales');

    // Exchange rates form
    const { data, setData, post, processing } = useForm({
        rates: exchangeRates.map(r => ({ currency_code: r.currency_code, rate: r.rate }))
    });

    const handleRateChange = (code: string, value: string) => {
        const newRates = data.rates.map(r =>
            r.currency_code === code ? { ...r, rate: parseFloat(value) || 0 } : r
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

    const filteredSales = sales.filter(sale => {
        const customerName = sale.customer?.name || 'cliente eventual';
        const matchesCustomer = customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesId = sale.id.toString().includes(searchTerm);
        return matchesCustomer || matchesId;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Financiero" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Control Financiero</h1>
                        <p className="text-muted-foreground text-sm mt-1">Gestión de ingresos, deudas y tasas de cambio en tiempo real.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <form onSubmit={submitRates} className="flex items-center gap-4">
                            <div className="flex items-center gap-2 pr-4 border-r border-zinc-200 dark:border-zinc-800">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin-slow" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tasas</span>
                            </div>
                            <div className="flex items-center gap-6">
                                {data.rates.map((rate) => (
                                    <div key={rate.currency_code} className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase">{rate.currency_code}:</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={rate.rate}
                                            onChange={(e) => handleRateChange(rate.currency_code, e.target.value)}
                                            className="bg-transparent border-none focus:ring-0 text-sm font-mono font-bold w-16 p-0 h-auto text-zinc-900 dark:text-zinc-100"
                                        />
                                    </div>
                                ))}
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                    className="h-7 py-0 px-3 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Fijar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Dashboard Cards - REORGANIZED */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Patrimony / Net Worth - HIGHLIGHTED */}
                    <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-indigo-600 to-indigo-700 text-white lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-80">PATRIMONIO TOTAL (COP)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight mb-1">
                                {Number(summary.net_worth_cop).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-indigo-100 font-medium opacity-90">
                                <Wallet className="h-3 w-3" />
                                <span>Caja + Cuentas por Cobrar</span>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp size={100} />
                        </div>
                    </Card>

                    {/* Pending Debts */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-orange-500">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Por Cobrar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{Number(summary.total_debt_cop).toLocaleString()}</span>
                                <span className="text-xs font-bold text-muted-foreground tracking-tighter">COP</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-orange-600 dark:text-orange-500">
                                <Clock className="h-3 w-3 text-orange-500" />
                                <span>Ref: ${Number(summary.total_debt_usd).toFixed(2)} USD</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today Revenue */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-green-500">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">Ingresos Hoy (COP)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-green-700 dark:text-green-400">{Number(summary.today_total_cop).toLocaleString()}</span>
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tight">
                                {summary.today_sales} ventas registradas
                            </p>
                        </CardContent>
                    </Card>

                    {/* Other Today Ref */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Ingresos Hoy (VES/USD)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Bs. {Number(summary.today_total_ves).toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">VES</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">${Number(summary.today_total_usd).toFixed(2)}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">USD</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-6 mt-4">
                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit shadow-inner mx-auto lg:mx-0">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                activeTab === 'sales'
                                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-md scale-[1.02]"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <HistoryIcon className="h-3.5 w-3.5" />
                            Historial
                        </button>
                        <button
                            onClick={() => setActiveTab('debtors')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                activeTab === 'debtors'
                                    ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-md scale-[1.02]"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Deudores
                            {debtors.length > 0 && (
                                <Badge className="ml-1 h-5 min-w-5 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white border-none text-[9px] font-black rounded-full">
                                    {debtors.length}
                                </Badge>
                            )}
                        </button>
                    </div>

                    {activeTab === 'sales' ? (
                        <Card className="border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl">
                            <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 p-6 border-b bg-zinc-50/30 dark:bg-zinc-800/10">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black tracking-tight">Registro de Transacciones</CardTitle>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Listado detallado de movimientos</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar por cliente o ID..."
                                        className="pl-10 h-11 text-sm bg-white dark:bg-zinc-800 border-dashed rounded-xl focus-visible:ring-indigo-500/30 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead>
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b">
                                                <th className="h-12 px-6 text-left font-black text-[10px] text-muted-foreground uppercase tracking-widest">Estado / Identificador</th>
                                                <th className="h-12 px-6 text-left font-black text-[10px] text-muted-foreground uppercase tracking-widest">Cliente & Cronología</th>
                                                <th className="h-12 px-6 text-left font-black text-[10px] text-muted-foreground uppercase tracking-widest">Detalle Items</th>
                                                <th className="h-12 px-6 text-right font-black text-[10px] text-muted-foreground uppercase tracking-widest">Total Pesos (COP)</th>
                                                <th className="h-12 px-6 text-right font-black text-[10px] text-muted-foreground uppercase tracking-widest">Cruce Moneda (Ref)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                                            {filteredSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="font-mono text-[10px] font-black text-zinc-400">#{sale.id}</span>
                                                            {sale.status === 'pending' ? (
                                                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none font-black text-[8px] px-1.5 h-4 w-fit uppercase">Crédito</Badge>
                                                            ) : (
                                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black text-[8px] px-1.5 h-4 w-fit uppercase text-center">Pagado</Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-50">{sale.customer?.name || 'Cliente Eventual'}</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                            {new Date(sale.created_at).toLocaleString('es-ES', {
                                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[240px] truncate">
                                                            {sale.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-black text-lg text-zinc-900 dark:text-zinc-50">
                                                            {Number(sale.total_cop).toLocaleString()}
                                                        </div>
                                                        {sale.status === 'pending' && (
                                                            <div className="flex flex-col items-end gap-0.5 mt-1 border-t pt-1 border-dotted">
                                                                <div className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Abonado: {Number(sale.paid_amount_cop).toLocaleString()}</div>
                                                                <div className="text-[10px] font-black text-destructive uppercase tracking-tighter">Deuda: {(Number(sale.total_cop) - Number(sale.paid_amount_cop)).toLocaleString()}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">${Number(sale.total_usd).toFixed(2)}</div>
                                                        <div className="text-[10px] font-bold text-blue-600/70 dark:text-blue-500/70 mt-1">Bs. {Number(sale.total_ves).toLocaleString()}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredSales.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-16 text-center text-muted-foreground italic">
                                                        <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                                        <p>No se encontraron registros de ventas.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg font-bold text-orange-700 dark:text-orange-400">Cuentas por Cobrar</CardTitle>
                                <p className="text-xs text-muted-foreground">Listado de deudas pendientes agrupadas por cliente.</p>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto text-sm">
                                    <table className="w-full min-w-[500px]">
                                        <thead>
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b">
                                                <th className="h-12 px-6 text-left font-black text-[10px] text-muted-foreground uppercase tracking-widest">Cliente Deudor</th>
                                                <th className="h-12 px-6 text-center font-black text-[10px] text-muted-foreground uppercase tracking-widest">Movimientos</th>
                                                <th className="h-12 px-6 text-right font-black text-[10px] text-muted-foreground uppercase tracking-widest">Saldo Pendiente (COP)</th>
                                                <th className="h-12 px-6 text-right font-black text-[10px] text-muted-foreground uppercase tracking-widest">Monto Ref. (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {debtors.map((debtor) => (
                                                <tr key={debtor.customer_id} className="hover:bg-orange-50/20 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                                                        {debtor.customer_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="secondary" className="font-mono">{debtor.sale_count}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-lg font-black text-orange-700 dark:text-orange-400 font-mono">
                                                            {Number(debtor.total_debt_cop).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-zinc-500">
                                                        ${Number(debtor.total_debt_usd).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {debtors.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-16 text-center text-muted-foreground italic">
                                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                                        <p>No hay deudas pendientes actualmente. ¡Todo al día!</p>
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
