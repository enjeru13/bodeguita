/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Minus,
    PackageSearch,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface Product {
    id: number;
    name: string;
    description: string | null;
    sku: string | null;
    selling_price: number;
    stock: number;
}

interface Customer {
    id: number;
    name: string;
    identity_document: string | null;
}

interface CartItem extends Product {
    quantity: number;
}

interface ExchangeRates {
    [key: string]: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'POS - Punto de Venta',
        href: '/pos',
    },
];

export default function PosIndex({
    products,
    customers,
    exchangeRates,
    pendingOrders = [],
}: {
    products: Product[];
    customers: Customer[];
    exchangeRates: ExchangeRates;
    pendingOrders?: any[];
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('0');
    const [customerSearch, setCustomerSearch] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCredit, setIsCredit] = useState(false);
    const [paidAmount, setPaidAmount] = useState<string>('0');
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(
                (item) => item.id === product.id,
            );
            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    toast.error('No hay suficiente stock');
                    return prevCart;
                }
                return prevCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const loadOrder = (order: any) => {
        // Convertir items del pedido al formato del carrito
        const newCart = order.items.map((item: any) => ({
            ...item.product,
            quantity: item.quantity,
        }));

        setCart(newCart);
        setSelectedCustomerId(order.customer_id.toString());
        setActiveOrderId(order.id);
        setIsOrdersModalOpen(false);
        setIsCartOpen(true);
        toast.success(`Pedido de ${order.customer.name} cargado correctamente`);
    };

    const rejectOrder = (orderId: number) => {
        if (
            !confirm(
                '¿Estás seguro de rechazar este pedido? Se eliminará permanentemente.',
            )
        )
            return;

        router.delete(`/sales/${orderId}/reject`, {
            onSuccess: () => toast.success('Pedido rechazado'),
        });
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty < 1) return item;
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

    const clearCart = () => {
        setCart([]);
        toast.success('Carrito vaciado');
    };

    const totals = useMemo(() => {
        const usd = cart.reduce(
            (acc, item) => acc + Number(item.selling_price) * item.quantity,
            0,
        );
        // Calculamos el COP sumando los subtotales redondeados de cada item para evitar inconsistencias visuales
        const cop = cart.reduce(
            (acc, item) =>
                acc +
                Math.round(
                    item.selling_price *
                        item.quantity *
                        (exchangeRates.COP || 0),
                ),
            0,
        );
        return {
            usd: usd,
            ves: usd * (exchangeRates.VES || 0),
            cop: cop,
        };
    }, [cart, exchangeRates]);

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        setIsProcessing(true);

        const payload = {
            customer_id:
                selectedCustomerId !== '0'
                    ? parseInt(selectedCustomerId)
                    : null,
            items: cart.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
            })),
            total_usd: totals.usd,
            total_ves: totals.ves,
            total_cop: totals.cop,
            paid_amount_cop: isCredit
                ? Math.round(parseFloat(paidAmount || '0'))
                : totals.cop,
            paid_amount_usd: isCredit
                ? Math.round((parseFloat(paidAmount || '0') / (exchangeRates.COP || 1)) * 100) / 100
                : totals.usd,
            paid_amount_ves: isCredit
                ? Math.round((parseFloat(paidAmount || '0') / (exchangeRates.COP || 1)) * (exchangeRates.VES || 0) * 100) / 100
                : totals.ves,
            exchange_rate_ves: exchangeRates.VES || 0,
            exchange_rate_cop: exchangeRates.COP || 0,
            status: isCredit ? 'pending' : 'completed',
            order_id: activeOrderId,
        };

        router.post('/pos', payload, {
            onSuccess: () => {
                setCart([]);
                setSelectedCustomerId('0');
                setIsCredit(false);
                setPaidAmount('0');
                setActiveOrderId(null);
                toast.success('Venta completada con éxito');
                setIsProcessing(false);
            },
            onError: (errors) => {
                Object.values(errors).forEach((err) =>
                    toast.error(err as string),
                );
                setIsProcessing(false);
            },
        });
    };

    const paymentSection = (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                    <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        Base USD:
                    </span>
                    <span className="font-mono text-sm font-black">
                        ${totals.usd.toFixed(2)}
                    </span>
                </div>
                <div className="flex items-center justify-between p-1 text-[10px] font-bold tracking-widest text-blue-600/70 uppercase dark:text-blue-400/70">
                    <span>Bs. Referencial:</span>
                    <span className="font-mono">
                        Bs.{' '}
                        {totals.ves.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
            </div>

            <div className="space-y-4 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <div className="flex items-center rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-3 dark:border-indigo-900/20 dark:bg-indigo-900/10">
                    <Checkbox
                        id="isCredit"
                        checked={isCredit}
                        onCheckedChange={(checked) => {
                            setIsCredit(!!checked);
                            if (checked) setPaidAmount('0');
                        }}
                        className="h-5 w-5 rounded-md border-indigo-300 data-[state=checked]:bg-indigo-600"
                    />
                    <Label
                        htmlFor="isCredit"
                        className="ml-3 cursor-pointer text-[10px] font-black tracking-widest text-indigo-700 uppercase dark:text-indigo-400"
                    >
                        Venta a Crédito / Abonos
                    </Label>
                </div>

                <div className="animate-in space-y-2 duration-200 fade-in slide-in-from-top-1">
                    <Label className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        {isCredit
                            ? 'Abono / Pago Inicial (COP)'
                            : 'Efectivo Recibido (COP)'}
                    </Label>
                    <Input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="h-12 rounded-xl border-dashed bg-white font-mono text-lg font-black text-emerald-600 dark:bg-zinc-800"
                        placeholder="0"
                    />

                    <div className="grid grid-cols-3 gap-1.5 pt-1 sm:grid-cols-6">
                        {[2000, 4000, 6000, 8000, 10000, 12000].map(
                            (amount) => (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() =>
                                        setPaidAmount(amount.toString())
                                    }
                                    className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-black transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-emerald-900/20"
                                >
                                    {amount / 1000}k
                                </button>
                            ),
                        )}
                    </div>

                    <div className="flex items-center justify-between px-1 text-[10px] font-bold">
                        {parseFloat(paidAmount || '0') > totals.cop ? (
                            <>
                                <span className="text-emerald-600 uppercase">
                                    Cambio / Vuelto:
                                </span>
                                <span className="text-sm text-emerald-600">
                                    {(
                                        parseFloat(paidAmount || '0') -
                                        totals.cop
                                    ).toLocaleString()}{' '}
                                    COP
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-muted-foreground uppercase">
                                    {isCredit
                                        ? 'Deuda Restante:'
                                        : 'Falta por pagar:'}
                                </span>
                                <span
                                    className={
                                        isCredit
                                            ? 'text-red-500'
                                            : 'text-amber-500'
                                    }
                                >
                                    {(
                                        totals.cop -
                                        parseFloat(paidAmount || '0')
                                    ).toLocaleString()}{' '}
                                    COP
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <Button
                    className={`h-16 w-full gap-3 rounded-2xl border-none text-lg font-black tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] ${isCredit ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={
                        cart.length === 0 ||
                        isProcessing ||
                        (isCredit && selectedCustomerId === '0')
                    }
                    onClick={handleCheckout}
                >
                    {isProcessing ? (
                        'PROCESANDO...'
                    ) : (
                        <>
                            {isCredit ? (
                                <Clock className="h-6 w-6" />
                            ) : (
                                <CheckCircle2 className="h-6 w-6" />
                            )}
                            {isCredit ? 'REGISTRAR CRÉDITO' : 'FINALIZAR VENTA'}
                        </>
                    )}
                </Button>
                {isCredit && selectedCustomerId === '0' && (
                    <p className="text-center text-[10px] font-black tracking-widest text-red-500 uppercase opacity-80">
                        Seleccione un cliente para crédito
                    </p>
                )}
            </div>
        </div>
    );

    const cartContent = (
        <div className="flex h-full flex-col border-l bg-white pt-8 lg:pt-0 dark:bg-zinc-900">
            <CardHeader className="mt-3 shrink-0 border-b bg-zinc-50/50 p-6 dark:bg-zinc-800/20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                            <ShoppingCart className="h-5 w-5 text-indigo-500" />
                            CARRITO
                        </CardTitle>
                        <p className="mt-0.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            Orden de venta
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearCart}
                                className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <Badge className="flex h-7 items-center justify-center rounded-lg border-none bg-indigo-600 px-3 font-black text-white">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            {!showPaymentOptions && (
                <div className="shrink-0 border-b bg-white p-6 dark:bg-zinc-900">
                    <Label className="mb-2 block text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        Cliente Responsable
                    </Label>
                    <Select
                        value={selectedCustomerId}
                        onValueChange={setSelectedCustomerId}
                    >
                        <SelectTrigger className="h-11 rounded-xl border-dashed focus:ring-indigo-500/30">
                            <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <div className="sticky top-0 z-10 bg-white p-2 dark:bg-zinc-900">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar..."
                                        value={customerSearch}
                                        onChange={(e) =>
                                            setCustomerSearch(e.target.value)
                                        }
                                        className="h-8 rounded-lg pl-7 text-[10px]"
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                            <SelectItem
                                value="0"
                                className="text-xs font-bold uppercase"
                            >
                                Cliente Eventual (Mostrador)
                            </SelectItem>
                            {customers
                                .filter(
                                    (c) =>
                                        c.name
                                            .toLowerCase()
                                            .includes(
                                                customerSearch.toLowerCase(),
                                            ) ||
                                        (c.identity_document &&
                                            c.identity_document.includes(
                                                customerSearch,
                                            )),
                                )
                                .map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                        className="text-xs font-bold"
                                    >
                                        {customer.name}{' '}
                                        {customer.identity_document
                                            ? `— ${customer.identity_document}`
                                            : ''}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
                {cart.map((item) => (
                    <div
                        key={item.id}
                        className="group flex gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-3 dark:border-zinc-800 dark:bg-zinc-800/10"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {item.name}
                            </div>
                            <div className="mt-0.5 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                                {Math.round(
                                    item.selling_price *
                                        (exchangeRates.COP || 0),
                                ).toLocaleString()}{' '}
                                COP / UNIDAD
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex h-7 items-center overflow-hidden rounded-lg border bg-white dark:bg-zinc-900">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-full w-7 rounded-none hover:bg-zinc-100"
                                    onClick={() => updateQuantity(item.id, -1)}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-xs font-black">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-full w-7 rounded-none hover:bg-zinc-100"
                                    onClick={() => updateQuantity(item.id, 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                                onClick={() => removeFromCart(item.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                    {Math.round(
                                        item.selling_price *
                                            item.quantity *
                                            (exchangeRates.COP || 0),
                                    ).toLocaleString()}
                                    <span className="ml-1 text-[10px] opacity-70">
                                        COP
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {cart.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                        <ShoppingCart className="mb-2 h-10 w-10" />
                        <p className="text-[10px] font-black tracking-widest uppercase">
                            Carrito vacío
                        </p>
                    </div>
                )}
            </div>

            <div className="shrink-0 space-y-3 border-t bg-zinc-50/50 p-4 lg:p-6 dark:bg-zinc-900">
                {!showPaymentOptions ? (
                    <>
                        <div className="flex items-baseline justify-between">
                            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Total a Pagar
                            </span>
                            <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {totals.cop.toLocaleString()} COP
                            </span>
                        </div>
                        <Button
                            className="h-14 w-full gap-2 rounded-2xl bg-indigo-600 text-lg font-black tracking-widest text-white shadow-lg lg:hidden"
                            onClick={() => setShowPaymentOptions(true)}
                            disabled={cart.length === 0}
                        >
                            CONTINUAR AL PAGO
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="hidden lg:block">{paymentSection}</div>
                    </>
                ) : (
                    <div className="animate-in duration-300 slide-in-from-right-5">
                        <Button
                            variant="ghost"
                            className="mb-2 h-8 px-2 text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-zinc-600"
                            onClick={() => setShowPaymentOptions(false)}
                        >
                            <ChevronLeft className="mr-1 h-3 w-3" />
                            Volver al Carrito
                        </Button>
                        {paymentSection}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Punto de Venta" />

            <div className="flex h-[calc(100vh-65px)] flex-row gap-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-4">
                            <h1 className="hidden text-xl font-black tracking-tight text-zinc-900 lg:block dark:text-zinc-50">
                                Terminal POS
                            </h1>
                            <div className="relative max-w-md flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    placeholder="Buscar producto..."
                                    className="h-11 rounded-xl border-none bg-white pl-10 font-medium shadow-sm transition-all focus-visible:ring-indigo-500/30 dark:bg-zinc-900"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {pendingOrders.length > 0 && (
                                <Button
                                    variant="outline"
                                    className="h-10 gap-2 rounded-xl border-indigo-200 bg-indigo-50 px-4 text-[10px] font-black tracking-widest text-indigo-700 uppercase hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400"
                                    onClick={() => setIsOrdersModalOpen(true)}
                                >
                                    <PackageSearch className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Pedidos Online
                                    </span>
                                    <Badge className="h-5 min-w-5 border-none bg-indigo-600 p-0 text-[10px] font-black text-white">
                                        {pendingOrders.length}
                                    </Badge>
                                </Button>
                            )}
                            <div className="hidden gap-3 text-xs sm:flex">
                                <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                    <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">
                                        VES:
                                    </span>
                                    <span className="font-mono font-bold">
                                        {Number(exchangeRates.VES).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                    <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                                        COP:
                                    </span>
                                    <span className="font-mono font-bold">
                                        {Number(
                                            exchangeRates.COP,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {filteredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border-transparent bg-white shadow-sm transition-all hover:border-indigo-500/50 hover:shadow-md active:scale-95 dark:bg-zinc-900"
                                    onClick={() => addToCart(product)}
                                >
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="line-clamp-2 text-sm font-bold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                                            {product.name}
                                        </CardTitle>
                                        <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            {product.sku || 'S/C'}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="mt-auto flex flex-col p-4 pt-0">
                                        <div className="mt-2 flex flex-col gap-0.5">
                                            <div className="text-lg leading-tight font-black text-emerald-600 dark:text-emerald-400">
                                                {/* Visualizacion en el catalogo redondeada */}
                                                {Math.round(
                                                    product.selling_price *
                                                        (exchangeRates.COP ||
                                                            0),
                                                ).toLocaleString(undefined, {
                                                    maximumFractionDigits: 0,
                                                })}
                                                <span className="ml-1 text-[10px] font-bold uppercase opacity-60">
                                                    COP
                                                </span>
                                            </div>
                                            <div className="font-mono text-[11px] font-bold text-muted-foreground">
                                                $
                                                {Number(
                                                    product.selling_price,
                                                ).toFixed(2)}{' '}
                                                USD
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between border-t border-zinc-50 pt-3 dark:border-zinc-800">
                                            <Badge
                                                className={`h-5 rounded-md border-none px-1.5 py-0 text-[9px] font-black ${
                                                    product.stock < 10
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                                                }`}
                                            >
                                                STK: {product.stock}
                                            </Badge>
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                <Plus className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="hidden w-[350px] flex-col overflow-hidden border-l bg-zinc-50/50 lg:flex dark:bg-zinc-900/50">
                    {cartContent}
                </div>

                <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                    <SheetContent
                        side="right"
                        className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-md"
                    >
                        {/* Encabezado Invisible para Accesibilidad */}
                        <SheetHeader className="sr-only">
                            <SheetTitle>Carrito de Compras</SheetTitle>
                            <SheetDescription>
                                Resumen de productos seleccionados para la venta
                                actual
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-hidden">
                            {cartContent}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Barra Flotante para Móvil (Píldora) */}
                {cart.length > 0 && (
                    <div className="fixed right-6 bottom-6 left-6 z-50 animate-in slide-in-from-bottom-10 fade-in lg:hidden">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="flex w-full items-center justify-between gap-4 rounded-2xl bg-indigo-600 p-4 font-black text-white shadow-2xl shadow-indigo-500/50 transition-all active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">
                                        Tu Pedido
                                    </p>
                                    <p className="text-sm">
                                        {cart.reduce(
                                            (acc, item) => acc + item.quantity,
                                            0,
                                        )}{' '}
                                        productos
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">
                                        Total COP
                                    </p>
                                    <p className="text-lg leading-tight">
                                        {totals.cop.toLocaleString()}
                                    </p>
                                </div>
                                <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            <Sheet open={isOrdersModalOpen} onOpenChange={setIsOrdersModalOpen}>
                <SheetContent
                    side="left"
                    className="w-full p-0 sm:max-w-md dark:bg-zinc-900"
                >
                    <SheetHeader className="p-6 pb-2">
                        <SheetTitle className="text-xl font-black tracking-tight uppercase">
                            Pedidos en Línea
                        </SheetTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Selecciona un pedido para cargarlo al POS
                        </p>
                    </SheetHeader>

                    <div className="flex-1 space-y-4 overflow-y-auto p-6">
                        {pendingOrders.map((order) => (
                            <Card
                                key={order.id}
                                className="overflow-hidden border-none bg-zinc-50 transition-all hover:bg-white dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                            >
                                <CardContent className="p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                                                <UserCheck className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-black uppercase">
                                                {order.customer.name}
                                            </span>
                                        </div>
                                        <Badge className="bg-orange-100 text-[8px] font-black text-orange-700 uppercase">
                                            NUEVO
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        {order.items.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between text-[11px] font-bold text-muted-foreground"
                                            >
                                                <span>
                                                    {item.quantity}x{' '}
                                                    {item.product.name}
                                                </span>
                                                <span className="font-mono">
                                                    {Math.round(
                                                        Number(item.price_usd) *
                                                            item.quantity *
                                                            (exchangeRates.COP ||
                                                                0),
                                                    ).toLocaleString()}{' '}
                                                    COP
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-700">
                                        <div className="text-lg font-black text-indigo-600">
                                            {Math.round(
                                                Number(order.total_cop),
                                            ).toLocaleString()}{' '}
                                            COP
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    rejectOrder(order.id)
                                                }
                                                className="h-9 w-9 rounded-xl p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => loadOrder(order)}
                                                className="rounded-xl bg-indigo-600 text-[10px] font-black uppercase"
                                            >
                                                CARGAR AL POS
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
