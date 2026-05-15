/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Head, router } from '@inertiajs/react';
import {
    Clock,
    History,
    LogOut,
    Minus,
    Package,
    Plus,
    Search,
    Send,
    ShoppingBag,
    Trash2,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    selling_price: number;
    stock: number;
    sku?: string | null;
}

interface CartItem extends Product {
    quantity: number;
}

interface Sale {
    id: number;
    total_usd: number;
    total_cop: number;
    paid_amount_cop: number;
    status: string;
    created_at: string;
    items: any[];
}

interface Props {
    customer: {
        name: string;
        identity_document: string;
    };
    sales: Sale[];
    totalDebtCop: number;
    totalDebtUsd: number;
    products: Product[];
    exchangeRates: Record<string, number>;
}

export default function ClientDashboard({
    customer,
    sales,
    totalDebtCop,
    totalDebtUsd,
    products,
    exchangeRates,
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const logout = () => {
        router.post('/client/logout');
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: currency === 'COP' ? 0 : 2,
        }).format(amount);
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error('No hay suficiente stock');
                    return prev;
                }
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success(`${product.name} añadido`);
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.id === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    if (newQty > item.stock) {
                        toast.error('Stock máximo alcanzado');
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            }),
        );
    };

    const cartTotalUsd = useMemo(() => {
        return cart.reduce(
            (acc, item) => acc + Number(item.selling_price) * item.quantity,
            0,
        );
    }, [cart]);

    const submitOrder = () => {
        if (cart.length === 0 || isSubmitting) return;

        setIsSubmitting(true);
        router.post(
            '/client/order',
            {
                items: cart.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                })),
            },
            {
                onSuccess: () => {
                    setCart([]);
                    setIsCartOpen(false);
                    setActiveTab('history');
                    toast.success('¡Pedido enviado con éxito!');
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 dark:bg-zinc-950">
            <Head title="Mi Cuenta - Bodeguita" />

            {/* Header POS Style */}
            <header className="sticky top-0 z-40 border-b bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-[10px] leading-none font-black tracking-widest text-muted-foreground uppercase">
                                Mi Bodeguita
                            </h2>
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                                {customer.name}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-500"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Top Stats - POS Visual Style */}
            <div className="mx-auto max-w-lg space-y-4 p-4">
                <Card className="relative overflow-hidden border-none bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black tracking-widest text-indigo-100 uppercase opacity-70">
                                    Saldo Pendiente
                                </p>
                                <div className="text-3xl font-black tracking-tight">
                                    {formatCurrency(totalDebtCop, 'COP')}
                                </div>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex w-fit items-center gap-2 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-indigo-100/90">
                            <TrendingUp className="h-3 w-3" />
                            <span>
                                Equivalente a{' '}
                                {formatCurrency(totalDebtUsd, 'USD')} USD
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Switcher */}
                <div className="flex rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900">
                    <button
                        onClick={() => setActiveTab('shop')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'shop' ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800' : 'text-zinc-500'}`}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Tienda
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800' : 'text-zinc-500'}`}
                    >
                        <History className="h-4 w-4" />
                        Mis Pedidos
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {activeTab === 'shop' ? (
                        <>
                            {/* Search & Filter - POS Style */}
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar productos..."
                                        className="h-12 rounded-2xl border-none bg-white pl-11 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20 dark:bg-zinc-900"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Products Grid */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {products
                                    .filter((p) =>
                                        p.name
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase()),
                                    )
                                    .map((product) => (
                                        <Card
                                            key={product.id}
                                            className="group cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-sm transition-all active:scale-[0.97] dark:bg-zinc-900"
                                            onClick={() => addToCart(product)}
                                        >
                                            <CardHeader className="p-3 pb-1">
                                                <h3 className="line-clamp-2 text-[11px] font-black text-zinc-900 uppercase dark:text-zinc-100">
                                                    {product.name}
                                                </h3>
                                                <div className="text-[9px] font-bold tracking-tight text-zinc-400 uppercase">
                                                    {product.sku || 'S/C'}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(
                                                            Math.round(
                                                                product.selling_price *
                                                                    (exchangeRates.COP ||
                                                                        0),
                                                            ),
                                                            'COP',
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-zinc-400">
                                                        $
                                                        {Number(
                                                            product.selling_price,
                                                        ).toFixed(2)}{' '}
                                                        USD
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <Badge
                                                        variant="outline"
                                                        className={`h-5 border-none px-1.5 text-[8px] font-black ${product.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-500'}`}
                                                    >
                                                        {product.stock} DISP.
                                                    </Badge>
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </>
                    ) : (
                        /* History View */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                                    Historial Reciente
                                </h3>
                                <Badge className="border-none bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase">
                                    {sales.length} Pedidos
                                </Badge>
                            </div>

                            {sales.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                    <Clock className="mb-2 h-12 w-12" />
                                    <p className="text-[10px] font-black tracking-widest uppercase">
                                        No hay pedidos aún
                                    </p>
                                </div>
                            ) : (
                                sales.map((sale) => (
                                    <Card
                                        key={sale.id}
                                        className="overflow-hidden border-none bg-white shadow-sm dark:bg-zinc-900"
                                    >
                                        <CardContent className="p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase">
                                                        {new Date(
                                                            sale.created_at,
                                                        ).toLocaleDateString(
                                                            'es-ES',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                    <span className="text-xs font-black tracking-tight text-zinc-900 uppercase dark:text-zinc-100">
                                                        Factura #{sale.id}
                                                    </span>
                                                </div>
                                                <Badge
                                                    className={`h-6 border-none px-2 text-[9px] font-black uppercase ${
                                                        sale.status ===
                                                        'order_pending'
                                                            ? 'bg-orange-100 text-orange-600'
                                                            : sale.status ===
                                                                'completed'
                                                              ? 'bg-emerald-100 text-emerald-600'
                                                              : 'bg-indigo-100 text-indigo-600'
                                                    }`}
                                                >
                                                    {sale.status ===
                                                    'order_pending'
                                                        ? 'Enviado'
                                                        : sale.status ===
                                                            'completed'
                                                          ? 'Pagado'
                                                          : 'Por Pagar'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1 border-t border-dashed border-zinc-100 pt-3 dark:border-zinc-800">
                                                {sale.items
                                                    ?.slice(0, 2)
                                                    .map(
                                                        (
                                                            item: any,
                                                            idx: number,
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between text-[10px] font-bold text-zinc-500"
                                                            >
                                                                <span>
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                    x{' '}
                                                                    {
                                                                        item
                                                                            .product
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span>
                                                                    {formatCurrency(
                                                                        Math.round(
                                                                            item.price_usd *
                                                                                item.quantity *
                                                                                (exchangeRates.COP ||
                                                                                    0),
                                                                        ),
                                                                        'COP',
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                {sale.items?.length > 2 && (
                                                    <p className="text-[8px] font-black text-indigo-500 uppercase">
                                                        +{sale.items.length - 2}{' '}
                                                        productos más
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-baseline justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                                <span className="text-[9px] font-black text-muted-foreground uppercase">
                                                    Total:
                                                </span>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-indigo-600">
                                                        {formatCurrency(
                                                            Math.round(
                                                                sale.total_cop,
                                                            ),
                                                            'COP',
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-zinc-400">
                                                        $
                                                        {Number(
                                                            sale.total_usd,
                                                        ).toFixed(2)}{' '}
                                                        USD
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Floating Bar - POS STYLE */}
            {activeTab === 'shop' && (
                <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white/80 p-4 pb-8 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
                    <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">
                                Subtotal Pedido
                            </p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-indigo-600">
                                    {formatCurrency(
                                        Math.round(
                                            cartTotalUsd *
                                                (exchangeRates.COP || 0),
                                        ),
                                        'COP',
                                    )}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400">
                                    ${Number(cartTotalUsd).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    className="relative h-14 rounded-2xl bg-indigo-600 px-8 text-[11px] font-black tracking-widest text-white shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-700 active:scale-95"
                                    disabled={cart.length === 0}
                                >
                                    VER PEDIDO
                                    <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                                        {cart.reduce(
                                            (acc, i) => acc + i.quantity,
                                            0,
                                        )}
                                    </div>
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="bottom"
                                className="h-[85vh] rounded-t-[32px] border-none p-0 dark:bg-zinc-900"
                            >
                                <div className="flex h-full flex-col">
                                    <SheetHeader className="p-6 pb-2">
                                        <SheetTitle className="text-2xl font-black tracking-tight uppercase">
                                            Tu Carrito
                                        </SheetTitle>
                                        <p className="text-xs font-bold text-muted-foreground uppercase">
                                            Ajusta las cantidades antes de
                                            enviar
                                        </p>
                                    </SheetHeader>

                                    <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                                        {cart.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50"
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-800">
                                                    <Package className="h-6 w-6 text-zinc-300" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate text-xs leading-tight font-black uppercase">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-indigo-600">
                                                        {formatCurrency(
                                                            Math.round(
                                                                item.selling_price *
                                                                    (exchangeRates.COP ||
                                                                        0),
                                                            ),
                                                            'COP',
                                                        )}{' '}
                                                        / ud
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center rounded-xl bg-white p-1 shadow-sm dark:bg-zinc-800">
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    -1,
                                                                )
                                                            }
                                                            className="p-1 text-zinc-400 hover:text-indigo-600"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-black">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    1,
                                                                )
                                                            }
                                                            className="p-1 text-zinc-400 hover:text-indigo-600"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.id,
                                                            )
                                                        }
                                                        className="ml-1 text-red-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <SheetFooter className="border-t bg-zinc-50/80 p-6 backdrop-blur-md dark:bg-zinc-800/50">
                                        <div className="w-full space-y-4">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase">
                                                        Total del Pedido
                                                    </p>
                                                    <div className="text-3xl font-black text-indigo-600">
                                                        {formatCurrency(
                                                            Math.round(
                                                                cartTotalUsd *
                                                                    (exchangeRates.COP ||
                                                                        0),
                                                            ),
                                                            'COP',
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right text-[11px] font-bold text-zinc-400">
                                                    $
                                                    {Number(
                                                        cartTotalUsd,
                                                    ).toFixed(2)}{' '}
                                                    USD
                                                </div>
                                            </div>
                                            <Button
                                                onClick={submitOrder}
                                                disabled={
                                                    cart.length === 0 ||
                                                    isSubmitting
                                                }
                                                className="h-16 w-full rounded-2xl bg-indigo-600 text-lg font-black tracking-widest text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98]"
                                            >
                                                <Send className="mr-3 h-6 w-6" />
                                                {isSubmitting
                                                    ? 'ENVIANDO...'
                                                    : 'ENVIAR MI PEDIDO'}
                                            </Button>
                                        </div>
                                    </SheetFooter>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            )}
        </div>
    );
}
