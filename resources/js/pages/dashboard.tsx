import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Clock,
    DollarSign,
    Package,
    RefreshCw,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';

interface Product {
    id: number;
    name: string;
    stock: number;
    sku: string | null;
}

interface Sale {
    id: number;
    total_usd: number;
    total_cop: number;
    created_at: string;
    customer?: { name: string };
}

interface DashboardProps {
    stats: {
        today_sales_usd: number;
        today_sales_cop: number;
        today_sales_ves: number;
        today_sales_count: number;
        total_products: number;
        low_stock_count: number;
        total_customers: number;
    };
    low_stock_products: Product[];
    recent_sales: Sale[];
    exchange_rates: Record<string, number>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    stats,
    low_stock_products,
    recent_sales,
    exchange_rates,
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Resumen General" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                        Bienvenido a La Bodeguita
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">
                        Control total de tu inventario y finanzas en tiempo
                        real.
                    </p>
                </div>

                {/* Main Stats - REFACTORED TO BOLD COCKPIT STYLE */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Sales Today - Indigo Gradient (High Impact) */}
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-left text-[10px] font-black tracking-widest text-indigo-200 uppercase opacity-80">
                                VENTAS DE HOY (COP)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 text-3xl font-black tracking-tight">
                                {Number(stats.today_sales_cop).toLocaleString()}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-indigo-100 opacity-90">
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>
                                        Bs.{' '}
                                        {Number(
                                            stats.today_sales_ves,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>
                                        $
                                        {Number(stats.today_sales_usd).toFixed(
                                            2,
                                        )}{' '}
                                        USD
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp size={100} />
                        </div>
                    </Card>

                    {/* Stock Table - Alert Style */}
                    <Card className="border-l-4 border-none border-l-orange-500 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-orange-600 uppercase dark:text-orange-400">
                                Alertas de Stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">
                                    {stats.low_stock_count}
                                </span>
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="mt-1 text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
                                Productos por agotar
                            </p>
                        </CardContent>
                    </Card>

                    {/* Products - Clean Style */}
                    <Card className="border-2 border-dashed border-zinc-200 bg-transparent shadow-md dark:border-zinc-800">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                Catálogo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">
                                    {stats.total_products}
                                </span>
                                <Package className="h-5 w-5 text-zinc-400" />
                            </div>
                            <p className="mt-1 text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
                                Artículos registrados
                            </p>
                        </CardContent>
                    </Card>

                    {/* Clients - Purple Style */}
                    <Card className="border-l-4 border-none border-l-purple-500 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-purple-600 uppercase dark:text-purple-400">
                                Comunidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">
                                    {stats.total_customers}
                                </span>
                                <Users className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="mt-1 text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
                                Clientes frecuentes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Sales List */}
                    <Card className="overflow-hidden border-none bg-white shadow-xl lg:col-span-4 dark:bg-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-zinc-50/50 py-2 dark:bg-zinc-800/50">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">
                                    Ventas Recientes
                                </CardTitle>
                                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                    Últimas transacciones
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <Link
                                    href="/financial"
                                    className="flex items-center gap-1 text-[10px] font-black tracking-widest text-indigo-600 uppercase"
                                >
                                    Ver todas <ArrowRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {recent_sales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between p-4 px-6 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                                                <DollarSign className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                    {sale.customer?.name ||
                                                        'Cliente Eventual'}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <Clock className="h-3 w-3" />{' '}
                                                    {new Date(
                                                        sale.created_at,
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-green-600 dark:text-green-400">
                                                {Number(
                                                    sale.total_cop,
                                                ).toLocaleString()}
                                            </div>
                                            <div className="font-mono text-[10px] font-bold text-muted-foreground">
                                                $
                                                {Number(sale.total_usd).toFixed(
                                                    2,
                                                )}{' '}
                                                USD
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recent_sales.length === 0 && (
                                    <div className="py-12 text-center text-sm text-muted-foreground italic">
                                        No hay ventas registradas hoy.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Stock Alerts */}
                    <Card className="overflow-hidden border-none bg-white shadow-xl lg:col-span-3 dark:bg-zinc-900">
                        {/* Header de Stock Crítico ajustado para igualar anchos */}
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-orange-50/30 py-2 dark:bg-orange-900/10">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-orange-700 dark:text-orange-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Stock Crítico
                                </CardTitle>
                                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-orange-600/70 uppercase">
                                    Requieren reposición inmediata
                                </p>
                            </div>
                            {/* Añadimos un div con el mismo ancho que el botón de la otra card para equilibrar el espacio */}
                            <div className="w-[88px]" aria-hidden="true" />
                        </CardHeader>
                        <CardContent className="flex h-full flex-col justify-between p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {low_stock_products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between p-4 px-6"
                                    >
                                        <div className="min-w-0 pr-4">
                                            <div className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                {product.name}
                                            </div>
                                            <div className="font-mono text-[10px] text-muted-foreground uppercase">
                                                SKU: {product.sku || '-'}
                                            </div>
                                        </div>
                                        <Badge className="h-6 rounded-md border-none bg-orange-500 px-2 text-[10px] font-black text-white hover:bg-orange-600">
                                            {product.stock} DISP.
                                        </Badge>
                                    </div>
                                ))}
                                {low_stock_products.length === 0 && (
                                    <div className="py-12 text-center text-sm text-muted-foreground italic">
                                        Todo está en orden con el inventario.
                                    </div>
                                )}
                            </div>
                            <div className="bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
                                <Button
                                    variant="outline"
                                    className="h-10 w-full border-2 text-[10px] font-black tracking-widest uppercase hover:bg-white dark:hover:bg-zinc-900"
                                    asChild
                                >
                                    <Link href="/inventory">
                                        Ir al Inventario
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions & Rates Inline - REBOT STYLE */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-none bg-white shadow-md lg:col-span-1 dark:bg-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-[10px] font-black tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                Divisas Vivas
                            </CardTitle>
                            <RefreshCw className="animate-spin-slow h-3.5 w-3.5 text-zinc-400" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                                <span className="text-xs font-black tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                    Bolívar (VES)
                                </span>
                                <span className="font-mono text-lg font-black text-zinc-900 dark:text-zinc-100">
                                    Bs.{' '}
                                    {Number(exchange_rates.VES || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                                <span className="text-xs font-black tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                                    Pesos (COP)
                                </span>
                                <span className="font-mono text-lg font-black text-zinc-900 dark:text-zinc-100">
                                    {Number(
                                        exchange_rates.COP || 0,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-zinc-200 bg-white shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <CardHeader className="px-6 py-4">
                            <CardTitle className="text-[10px] font-black tracking-widest text-zinc-400 uppercase underline decoration-indigo-500/30 underline-offset-4 dark:text-zinc-500">
                                Panel de Operaciones
                            </CardTitle>
                        </CardHeader>
<CardContent className="flex flex-col gap-4 md:flex-row md:gap-4">
    {/* Botón VENDER */}
    <Button
        className="group relative min-h-[110px] flex-1 overflow-hidden rounded-2xl border-none bg-indigo-600 p-0 shadow-lg transition-all hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-[0.98]"
        asChild
    >
        <Link href="/pos" className="flex h-full w-full items-center gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md transition-transform group-hover:rotate-12">
                <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col items-start leading-tight">
                <span className="text-base font-black tracking-tight text-white">VENDER</span>
                <span className="text-[10px] font-bold tracking-widest text-indigo-100/90 uppercase mt-1">Terminal POS</span>
            </div>
        </Link>
    </Button>

    {/* Botón ALMACÉN */}
    <Button
        variant="outline"
        className="group relative min-h-[110px] flex-1 overflow-hidden rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-0 shadow-sm transition-all hover:border-indigo-200 hover:bg-white active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
        asChild
    >
        <Link href="/inventory" className="flex h-full w-full items-center gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-200/50 transition-transform group-hover:-rotate-12 dark:bg-zinc-700">
                <Package className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div className="flex flex-col items-start leading-tight">
                <span className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">ALMACÉN</span>
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Existencias</span>
            </div>
        </Link>
    </Button>
</CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
