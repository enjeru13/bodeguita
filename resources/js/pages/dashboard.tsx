import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingCart,
    Package,
    Users,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    DollarSign,
    Clock,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    exchange_rates
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Resumen General" />

            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Bienvenido a La Bodeguita</h1>
                    <p className="text-muted-foreground text-sm font-medium">Control total de tu inventario y finanzas en tiempo real.</p>
                </div>

                {/* Main Stats - REFACTORED TO BOLD COCKPIT STYLE */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Sales Today - Indigo Gradient (High Impact) */}
                    <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-80 text-left">VENTAS DE HOY (COP)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight mb-2">
                                {Number(stats.today_sales_cop).toLocaleString()}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-indigo-100 font-bold opacity-90">
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>Bs. {Number(stats.today_sales_ves).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>${Number(stats.today_sales_usd).toFixed(2)} USD</span>
                                </div>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp size={100} />
                        </div>
                    </Card>

                    {/* Stock Table - Alert Style */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-orange-500">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Alertas de Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{stats.low_stock_count}</span>
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">
                                Productos por agotar
                            </p>
                        </CardContent>
                    </Card>

                    {/* Products - Clean Style */}
                    <Card className="shadow-md bg-transparent border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Catálogo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{stats.total_products}</span>
                                <Package className="h-5 w-5 text-zinc-400" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">
                                Artículos registrados
                            </p>
                        </CardContent>
                    </Card>

                    {/* Clients - Purple Style */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-purple-500">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Comunidad</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{stats.total_customers}</span>
                                <Users className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">
                                Clientes frecuentes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Sales List */}
                    <Card className="lg:col-span-4 border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Ventas Recientes</CardTitle>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Últimas transacciones</p>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <Link href="/financial" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                    Ver todas <ArrowRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {recent_sales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-4 px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                                                <DollarSign className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{sale.customer?.name || 'Cliente Eventual'}</div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                                    <Clock className="h-3 w-3" /> {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-green-600 dark:text-green-400">
                                                {Number(sale.total_cop).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] font-mono font-bold text-muted-foreground">
                                                ${Number(sale.total_usd).toFixed(2)} USD
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recent_sales.length === 0 && (
                                    <div className="text-center py-12 text-sm text-muted-foreground italic">
                                        No hay ventas registradas hoy.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Stock Alerts */}
                    <Card className="lg:col-span-3 border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="pb-4 border-b bg-orange-50/30 dark:bg-orange-900/10">
                            <CardTitle className="text-xl font-black tracking-tight text-orange-700 dark:text-orange-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Stock Crítico
                            </CardTitle>
                            <p className="text-[10px] uppercase font-bold text-orange-600/70 tracking-widest mt-0.5">Requieren reposición inmediata</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {low_stock_products.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-4 px-6">
                                        <div className="min-w-0 pr-4">
                                            <div className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{product.name}</div>
                                            <div className="text-[10px] font-mono text-muted-foreground uppercase">SKU: {product.sku || '-'}</div>
                                        </div>
                                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] border-none px-2 h-6 rounded-md">
                                            {product.stock} DISP.
                                        </Badge>
                                    </div>
                                ))}
                                {low_stock_products.length === 0 && (
                                    <div className="text-center py-12 text-sm text-muted-foreground italic">
                                        Todo está en orden con el inventario.
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/50">
                                <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-2 hover:bg-white dark:hover:bg-zinc-900" asChild>
                                    <Link href="/inventory">Ir al Inventario</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions & Rates Inline - REBOT STYLE */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 my-10">
                    <Card className="lg:col-span-1 shadow-md border-none bg-white dark:bg-zinc-900">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Divisas Vivas</CardTitle>
                            <RefreshCw className="h-3.5 w-3.5 text-zinc-400 animate-spin-slow" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-100 dark:border-zinc-800">
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Bolívar (VES)</span>
                                <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">Bs. {Number(exchange_rates.VES || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-100 dark:border-zinc-800">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Pesos (COP)</span>
                                <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">{Number(exchange_rates.COP || 0).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 shadow-md bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-3 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Panel de Operaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row gap-4 md:gap-5 px-4 md:px-6 pb-8 pt-0">
                            <Button size="lg" className="w-full md:flex-1 h-32 md:h-36 rounded-2xl md:rounded-[3rem] shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all bg-indigo-600 hover:bg-indigo-700 border-none p-0 overflow-hidden" asChild>
                                <Link href="/pos" className="flex items-center gap-6 md:gap-6 px-8 md:px-10 w-full h-full justify-start">
                                    <div className="flex items-center justify-center h-14 w-14 md:h-16 bg-white/20 rounded-xl md:rounded-[2rem] shadow-inner backdrop-blur-sm shrink-0">
                                        <ShoppingCart className="h-6 w-6 md:h-7 text-white" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none py-4 md:py-4">
                                        <span className="text-xl md:text-xl font-black tracking-tighter text-white">VENDER</span>
                                        <span className="text-[10px] md:text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1.5 text-indigo-100">Terminal POS</span>
                                    </div>
                                </Link>
                            </Button>
                            <Button size="lg" variant="secondary" className="w-full md:flex-1 h-32 md:h-36 rounded-2xl md:rounded-[3rem] shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all border-none p-0 overflow-hidden bg-white dark:bg-zinc-800" asChild>
                                <Link href="/inventory" className="flex items-center gap-6 md:gap-6 px-8 md:px-10 w-full h-full justify-start">
                                    <div className="flex items-center justify-center h-14 w-14 md:h-16 bg-zinc-100 dark:bg-zinc-700 rounded-xl md:rounded-[2rem] shadow-inner shrink-0">
                                        <Package className="h-6 w-6 md:h-7 text-zinc-600 dark:text-zinc-300" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none py-4 md:py-4">
                                        <span className="text-xl md:text-xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">ALMACÉN</span>
                                        <span className="text-[10px] md:text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1.5">Existencias</span>
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


