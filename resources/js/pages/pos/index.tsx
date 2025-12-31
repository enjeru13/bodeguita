import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
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
    SheetTrigger,
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
}: {
    products: Product[];
    customers: Customer[];
    exchangeRates: ExchangeRates;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('0');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCredit, setIsCredit] = useState(false);
    const [paidAmount, setPaidAmount] = useState<string>('0');

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

    const totals = useMemo(() => {
        const usd = cart.reduce(
            (acc, item) => acc + item.selling_price * item.quantity,
            0,
        );
        return {
            usd: usd,
            ves: usd * (exchangeRates.VES || 0),
            cop: usd * (exchangeRates.COP || 0),
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
                ? parseFloat(paidAmount || '0')
                : totals.cop,
            paid_amount_usd: isCredit
                ? parseFloat(paidAmount || '0') / (exchangeRates.COP || 1)
                : totals.usd,
            paid_amount_ves: isCredit
                ? (parseFloat(paidAmount || '0') / (exchangeRates.COP || 1)) *
                  (exchangeRates.VES || 0)
                : totals.ves,
            exchange_rate_ves: exchangeRates.VES || 0,
            exchange_rate_cop: exchangeRates.COP || 0,
            status: isCredit ? 'pending' : 'completed',
        };

        router.post('/pos', payload, {
            onSuccess: () => {
                setCart([]);
                setSelectedCustomerId('0');
                setIsCredit(false);
                setPaidAmount('0');
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

    const cartContent = (
        <div className="flex h-full flex-col border-l bg-white pt-8 lg:pt-0 dark:bg-zinc-900">
            <CardHeader className="shrink-0 border-b bg-zinc-50/50 p-6 dark:bg-zinc-800/20">
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
                    <Badge className="flex h-7 items-center justify-center rounded-lg border-none bg-indigo-600 px-3 font-black text-white">
                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </Badge>
                </div>
            </CardHeader>

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
                        <SelectItem
                            value="0"
                            className="text-xs font-bold uppercase"
                        >
                            Cliente Eventual (Mostrador)
                        </SelectItem>
                        {customers.map((customer) => (
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
                                ${Number(item.selling_price).toFixed(2)} /
                                UNIDAD
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
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                    $
                                    {(
                                        item.selling_price * item.quantity
                                    ).toFixed(2)}
                                </div>
                                <button
                                    className="text-zinc-300 transition-colors hover:text-red-500"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
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

            <div className="shrink-0 space-y-4 border-t bg-zinc-50/50 p-6 dark:bg-zinc-900">
                <div className="space-y-2">
                    <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            Monto Total COP
                        </span>
                        <span className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {totals.cop.toLocaleString()}
                        </span>
                    </div>
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

                    {isCredit && (
                        <div className="animate-in space-y-2 duration-200 fade-in slide-in-from-top-1">
                            <Label className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Monto Recibido hoy (COP)
                            </Label>
                            <Input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                className="h-12 rounded-xl border-dashed bg-white font-mono text-lg font-black text-emerald-600 dark:bg-zinc-800"
                                placeholder="0"
                            />
                            <div className="flex items-center justify-between px-1 text-[10px] font-bold">
                                <span className="text-muted-foreground uppercase">
                                    Deuda Restante:
                                </span>
                                <span className="text-red-500">
                                    {(
                                        totals.cop -
                                        parseFloat(paidAmount || '0')
                                    ).toLocaleString()}{' '}
                                    COP
                                </span>
                            </div>
                        </div>
                    )}
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Punto de Venta" />

            <div className="flex h-[calc(100vh-65px)] flex-row gap-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                placeholder="Buscar producto por nombre o código..."
                                className="h-11 rounded-xl border-none bg-white pl-10 font-medium shadow-sm transition-all focus-visible:ring-indigo-500/30 dark:bg-zinc-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">
                                    VES:
                                </span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    Bs.{' '}
                                    {Number(exchangeRates.VES || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                                    COP:
                                </span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    {Number(
                                        exchangeRates.COP || 0,
                                    ).toLocaleString()}
                                </span>
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
                                                {(
                                                    product.selling_price *
                                                    (exchangeRates.COP || 0)
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

                {/* Mobile Floating Cart Bar con Accesibilidad Corregida */}
                <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] lg:hidden dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Total a Pagar
                            </span>
                            <span className="text-lg font-black text-green-700 dark:text-green-400">
                                {totals.cop.toLocaleString()} COP
                            </span>
                        </div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="relative gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                                    <ShoppingCart className="h-5 w-5" />
                                    Ver Carrito
                                    {cart.length > 0 && (
                                        <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 p-0 text-white dark:border-zinc-900">
                                            {cart.reduce(
                                                (acc, item) =>
                                                    acc + item.quantity,
                                                0,
                                            )}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="bottom"
                                className="flex h-[90vh] flex-col overflow-hidden rounded-t-[2rem] p-0 sm:max-w-none"
                            >
                                {/* Encabezado Invisible para Accesibilidad */}
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Carrito de Compras</SheetTitle>
                                    <SheetDescription>
                                        Resumen de productos seleccionados para
                                        la venta actual
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="flex-1 overflow-hidden">
                                    {cartContent}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
