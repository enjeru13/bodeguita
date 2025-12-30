import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    Minus,
    CheckCircle2,
    Package,
    Clock
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Sheet,
    SheetContent,
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
    exchangeRates
}: {
    products: Product[],
    customers: Customer[],
    exchangeRates: ExchangeRates
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('0');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCredit, setIsCredit] = useState(false);
    const [paidAmount, setPaidAmount] = useState<string>('0');

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    toast.error('No hay suficiente stock');
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prevCart => prevCart.map(item => {
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
        }));
    };

    const totals = useMemo(() => {
        const usd = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
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
            customer_id: selectedCustomerId !== '0' ? parseInt(selectedCustomerId) : null,
            items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
            total_usd: totals.usd,
            total_ves: totals.ves,
            total_cop: totals.cop,
            paid_amount_cop: isCredit ? parseFloat(paidAmount || '0') : totals.cop,
            paid_amount_usd: isCredit ? (parseFloat(paidAmount || '0') / (exchangeRates.COP || 1)) : totals.usd,
            paid_amount_ves: isCredit ? (parseFloat(paidAmount || '0') / (exchangeRates.COP || 1) * (exchangeRates.VES || 0)) : totals.ves,
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
                Object.values(errors).forEach(err => toast.error(err as string));
                setIsProcessing(false);
            }
        });
    };

    const cartContent = (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l">
            <CardHeader className="p-6 border-b shrink-0 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                            <ShoppingCart className="h-5 w-5 text-indigo-500" />
                            CARRITO
                        </CardTitle>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Orden de venta</p>
                    </div>
                    <Badge className="rounded-lg bg-indigo-600 font-black px-3 h-7 flex items-center justify-center border-none">
                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </Badge>
                </div>
            </CardHeader>

            {/* Customer Selection */}
            <div className="p-6 border-b shrink-0 bg-white dark:bg-zinc-900">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Cliente Responsable</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-11 rounded-xl border-dashed focus:ring-indigo-500/30">
                        <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="0" className="font-bold text-xs uppercase">Cliente Eventual (Mostrador)</SelectItem>
                        {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id.toString()} className="font-bold text-xs">
                                {customer.name} {customer.identity_document ? `— ${customer.identity_document}` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 group">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{item.name}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 tracking-tight">${Number(item.selling_price).toFixed(2)} / UNIDAD</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center bg-white dark:bg-zinc-900 border rounded-lg h-7 overflow-hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-full w-7 rounded-none hover:bg-zinc-100"
                                    onClick={() => updateQuantity(item.id, -1)}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
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
                                    ${(item.selling_price * item.quantity).toFixed(2)}
                                </div>
                                <button
                                    className="text-zinc-300 hover:text-red-500 transition-colors"
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
                        <ShoppingCart className="h-10 w-10 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Carrito vacío</p>
                    </div>
                )}
            </div>

            {/* Footer / Totals */}
            <div className="p-6 border-t bg-zinc-50/50 dark:bg-zinc-900 space-y-4 shrink-0">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monto Total COP</span>
                        <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {totals.cop.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base USD:</span>
                        <span className="text-sm font-black font-mono">${totals.usd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-1 text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest">
                        <span>Bs. Referencial:</span>
                        <span className="font-mono">Bs. {totals.ves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20">
                        <Checkbox
                            id="isCredit"
                            checked={isCredit}
                            onCheckedChange={(checked) => {
                                setIsCredit(!!checked);
                                if (checked) setPaidAmount('0');
                            }}
                            className="h-5 w-5 rounded-md border-indigo-300 data-[state=checked]:bg-indigo-600"
                        />
                        <Label htmlFor="isCredit" className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 ml-3 cursor-pointer">Venta a Crédito / Abonos</Label>
                    </div>

                    {isCredit && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <Label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest ml-1">Monto Recibido hoy (COP)</Label>
                            <Input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                className="h-12 rounded-xl text-lg font-black font-mono text-emerald-600 bg-white dark:bg-zinc-800 border-dashed"
                                placeholder="0"
                            />
                            <div className="flex justify-between items-center px-1 text-[10px] font-bold">
                                <span className="text-muted-foreground uppercase">Deuda Restante:</span>
                                <span className="text-red-500">{(totals.cop - parseFloat(paidAmount || '0')).toLocaleString()} COP</span>
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    className={`w-full h-16 rounded-2xl text-lg font-black tracking-widest gap-3 shadow-xl hover:scale-[1.02] transition-all border-none ${isCredit ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={cart.length === 0 || isProcessing || (isCredit && selectedCustomerId === '0')}
                    onClick={handleCheckout}
                >
                    {isProcessing ? 'PROCESANDO...' : (
                        <>
                            {isCredit ? <Clock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                            {isCredit ? 'REGISTRAR CRÉDITO' : 'FINALIZAR VENTA'}
                        </>
                    )}
                </Button>
                {isCredit && selectedCustomerId === '0' && (
                    <p className="text-[10px] text-red-500 text-center font-black uppercase tracking-widest opacity-80">Seleccione un cliente para crédito</p>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Punto de Venta" />

            <div className="flex h-[calc(100vh-65px)] flex-row gap-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                {/* Product Selection Area */}
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Buscar producto por nombre o código..."
                                className="pl-10 h-11 rounded-xl border-none shadow-sm bg-white dark:bg-zinc-900 focus-visible:ring-indigo-500/30 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <span className="font-black text-blue-500 uppercase tracking-widest text-[10px]">VES:</span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">Bs. {Number(exchangeRates.VES || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <span className="font-black text-emerald-500 uppercase tracking-widest text-[10px]">COP:</span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{Number(exchangeRates.COP || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20 lg:pb-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer hover:border-indigo-500/50 border-transparent shadow-sm hover:shadow-md bg-white dark:bg-zinc-900 flex flex-col h-full active:scale-95 transition-all overflow-hidden rounded-2xl group"
                                    onClick={() => addToCart(product)}
                                >
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-bold line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</CardTitle>
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{product.sku || 'S/C'}</div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 mt-auto flex flex-col">
                                        <div className="flex flex-col gap-0.5 mt-2">
                                            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                                                {(product.selling_price * (exchangeRates.COP || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                <span className="text-[10px] ml-1 uppercase font-bold opacity-60">COP</span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-mono font-bold">
                                                ${Number(product.selling_price).toFixed(2)} USD
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                                            <Badge className={`text-[9px] font-black px-1.5 py-0 h-5 rounded-md border-none ${product.stock < 10
                                                ? 'bg-red-500 text-white'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                }`}>
                                                STK: {product.stock}
                                            </Badge>
                                            <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-30">
                                <Package className="h-16 w-16 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-[10px]">Sin existencias disponibles</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Cart Sidebar */}
                <div className="hidden lg:flex w-[350px] border-l bg-zinc-50/50 dark:bg-zinc-900/50 flex-col overflow-hidden">
                    {cartContent}
                </div>

                {/* Mobile Floating Cart Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900 border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total a Pagar</span>
                            <span className="text-lg font-black text-green-700 dark:text-green-400">
                                {totals.cop.toLocaleString()} COP
                            </span>
                        </div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="gap-2 relative">
                                    <ShoppingCart className="h-5 w-5" />
                                    Ver Carrito
                                    {cart.length > 0 && (
                                        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full border-2 border-white dark:border-zinc-900">
                                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col sm:max-w-none">
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
