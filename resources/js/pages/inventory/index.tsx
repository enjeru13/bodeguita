import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    Edit,
    MoreVertical,
    Package,
    Percent,
    Plus,
    Search,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Definición del producto (El backend envía 'purchase_price' gracias al Accessor que creamos)
interface Product {
    id: number;
    name: string;
    description: string | null;
    sku: string | null;
    purchase_price: number; // Costo en USD
    selling_price: number; // Venta en USD
    stock: number;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventario y Rentabilidad',
        href: '/inventory',
    },
];

export default function InventoryIndex({
    products,
    exchangeRates,
}: {
    products: Product[];
    exchangeRates: Record<string, number>;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Tasa de cambio (Default 3650 si no existe)
    const copRate = exchangeRates.COP || 3650;

    // --- 1. CÁLCULOS FINANCIEROS GLOBALES EN COP ---
    // Calculamos el valor total del inventario multiplicando USD * Tasa del día
    const totalInventoryCostCOP = products.reduce(
        (acc, p) => acc + p.stock * Number(p.purchase_price) * copRate,
        0,
    );
    const totalInventorySalesCOP = products.reduce(
        (acc, p) => acc + p.stock * Number(p.selling_price) * copRate,
        0,
    );
    const totalPotentialProfitCOP =
        totalInventorySalesCOP - totalInventoryCostCOP;

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        name: '',
        description: '',
        sku: '',
        purchase_price: 0,
        selling_price: 0,
        stock: 0,
        // Helpers para el formulario en COP
        purchase_price_cop: 0,
        selling_price_cop: 0,
    });

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // --- HELPERS VISUALES ---
    const formatCOP = (amount: number) => {
        return Math.round(amount).toLocaleString('es-CO');
    };

    const calculateMargin = (cost: number, price: number) => {
        const c = Number(cost);
        const p = Number(price);
        if (c === 0) return 100;
        return ((p - c) / c) * 100;
    };

    // --- ACCIONES DEL CRUD ---
    const openCreateDialog = () => {
        setEditingProduct(null);
        reset();
        setIsDialogOpen(true);
    };

    const openEditDialog = (product: Product) => {
        setEditingProduct(product);
        const p_usd = Number(product.purchase_price);
        const s_usd = Number(product.selling_price);

        setData({
            name: product.name,
            description: product.description || '',
            sku: product.sku || '',
            purchase_price: p_usd,
            selling_price: s_usd,
            stock: product.stock,
            // Convertimos a COP para mostrar en el input
            purchase_price_cop: Math.round(p_usd * copRate),
            selling_price_cop: Math.round(s_usd * copRate),
        });
        setIsDialogOpen(true);
    };

    const handlePriceCopChange = (
        field: 'purchase_price' | 'selling_price',
        copValue: string,
    ) => {
        const val = parseFloat(copValue) || 0;
        setData((prev) => ({
            ...prev,
            [`${field}_cop`]: val,
            // Guardamos el valor en USD con alta precisión
            [field]: val / copRate,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            put(`/inventory/${editingProduct.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Producto actualizado correctamente');
                },
                onError: () => toast.error('Error al actualizar el producto'),
            });
        } else {
            post('/inventory', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Producto creado correctamente');
                },
                onError: () => toast.error('Error al crear el producto'),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            destroy(`/inventory/${id}`, {
                onSuccess: () => toast.success('Producto eliminado'),
                onError: () => toast.error('Error al eliminar el producto'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventario" />

            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header & Acción */}
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                            Inventario & Rentabilidad
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestión de existencias con análisis de costos y
                            márgenes en tiempo real (Tasa: {formatCOP(copRate)}
                            ).
                        </p>
                    </div>

                    <Button
                        onClick={openCreateDialog}
                        size="lg"
                        className="gap-2 rounded-2xl border-none bg-indigo-600 px-6 text-[11px] font-black tracking-widest uppercase shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Producto
                    </Button>
                </div>

                {/* --- 2. TARJETAS DE INTELIGENCIA DE NEGOCIO --- */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Costo Total */}
                    <Card className="border-none bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
                                Valor Invertido (Costo)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-blue-800 dark:text-blue-100">
                                    ${formatCOP(totalInventoryCostCOP)}
                                </span>
                                <span className="text-xs font-bold text-blue-400">
                                    COP
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Venta Total */}
                    <Card className="border-none bg-zinc-100 dark:bg-zinc-800/50">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                Venta Proyectada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-zinc-700 dark:text-zinc-300">
                                    ${formatCOP(totalInventorySalesCOP)}
                                </span>
                                <span className="text-xs font-bold text-zinc-400">
                                    COP
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ganancia Total */}
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-emerald-200 uppercase opacity-80">
                                Ganancia Neta Estimada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-black tracking-tight">
                                ${formatCOP(totalPotentialProfitCOP)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-100 opacity-90">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Utilidad potencial total</span>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Banknote size={80} />
                        </div>
                    </Card>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-2">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="Buscar por nombre o SKU..."
                            className="h-10 rounded-xl border-dashed pl-10 transition-all focus-visible:ring-indigo-500/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Contador de Stock Bajo */}
                    {products.filter((p) => p.stock < 10).length > 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            <AlertTriangle className="h-4 w-4" />
                            {products.filter((p) => p.stock < 10).length} Stock
                            Bajo
                        </div>
                    )}
                </div>

                {/* --- 3. TABLA DE INVENTARIO CON DATOS FINANCIEROS --- */}
                <div className="overflow-x-auto rounded-2xl border-none bg-white shadow-xl dark:bg-zinc-900">
                    <table className="w-full min-w-[1000px] text-sm">
                        <thead>
                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                <th className="h-12 px-6 text-left align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Producto
                                </th>
                                <th className="h-12 px-6 text-center align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Stock
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Costo Unit. (COP)
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-blue-600 uppercase">
                                    Venta Unit. (COP)
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                                    Ganancia Unit.
                                </th>
                                <th className="h-12 px-6 text-center align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Margen
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredProducts.map((product) => {
                                const costCOP =
                                    Number(product.purchase_price) * copRate;
                                const saleCOP =
                                    Number(product.selling_price) * copRate;
                                const profitCOP = saleCOP - costCOP;
                                const margin = calculateMargin(
                                    product.purchase_price,
                                    product.selling_price,
                                );

                                return (
                                    <tr
                                        key={product.id}
                                        className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                    >
                                        <td className="p-4 px-6 align-middle">
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                {product.name}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[9px] font-bold text-zinc-500 dark:bg-zinc-800">
                                                    {product.sku || '---'}
                                                </code>
                                            </div>
                                        </td>

                                        <td className="p-4 px-6 text-center align-middle">
                                            <Badge
                                                className={`h-6 rounded-md border-none px-2 text-[10px] font-black ${
                                                    product.stock < 10
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}
                                            >
                                                {product.stock}
                                            </Badge>
                                        </td>

                                        {/* Costo */}
                                        <td className="p-4 px-6 text-right align-middle font-mono text-zinc-500">
                                            ${formatCOP(costCOP)}
                                        </td>

                                        {/* Venta */}
                                        <td className="p-4 px-6 text-right align-middle">
                                            <div className="font-black text-blue-600 dark:text-blue-400">
                                                ${formatCOP(saleCOP)}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground">
                                                Ref: $
                                                {Number(
                                                    product.selling_price,
                                                ).toFixed(2)}{' '}
                                                USD
                                            </div>
                                        </td>

                                        {/* Ganancia */}
                                        <td className="p-4 px-6 text-right align-middle">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                + ${formatCOP(profitCOP)}
                                            </span>
                                        </td>

                                        {/* Margen */}
                                        <td className="p-4 px-6 text-center align-middle">
                                            <div
                                                className={`flex items-center justify-center gap-1 font-bold ${margin < 25 ? 'text-red-500' : 'text-green-600'}`}
                                            >
                                                <Percent className="h-3 w-3" />
                                                {margin.toFixed(0)}%
                                            </div>
                                        </td>

                                        <td className="p-4 px-6 text-right align-middle">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="rounded-xl border-none shadow-2xl"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEditDialog(
                                                                product,
                                                            )
                                                        }
                                                        className="gap-2 p-2.5 text-xs font-bold"
                                                    >
                                                        <Edit className="h-4 w-4 text-indigo-500" />{' '}
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleDelete(
                                                                product.id,
                                                            )
                                                        }
                                                        className="gap-2 p-2.5 text-xs font-bold text-red-500 focus:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />{' '}
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center gap-3 p-20 text-center text-muted-foreground italic">
                            <Package className="h-10 w-10 opacity-10" />
                            <p className="text-sm font-medium">
                                No se encontraron productos en el almacén
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct
                                ? 'Editar Producto'
                                : 'Nuevo Producto'}
                        </DialogTitle>
                        <DialogDescription>
                            Ingresa los precios en <strong>COP</strong>. El
                            sistema calculará y guardará la base en dólares
                            automáticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Nombre del Producto
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU / Código</Label>
                                    <Input
                                        id="sku"
                                        value={data.sku}
                                        onChange={(e) =>
                                            setData('sku', e.target.value)
                                        }
                                    />
                                    {errors.sku && (
                                        <p className="text-xs text-destructive">
                                            {errors.sku}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">Stock Actual</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={data.stock}
                                        onChange={(e) =>
                                            setData(
                                                'stock',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">
                                    Descripción (Opcional)
                                </Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                            </div>

                            {/* SECCIÓN DE PRECIOS CON FONDO RESALTADO */}
                            <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="purchase_price_cop"
                                        className="text-zinc-600 dark:text-zinc-400"
                                    >
                                        Costo Compra (COP)
                                    </Label>
                                    <Input
                                        id="purchase_price_cop"
                                        type="number"
                                        step="any"
                                        className="border-blue-200 bg-white font-bold text-blue-700 dark:bg-zinc-900 dark:text-blue-300"
                                        value={data.purchase_price_cop}
                                        onChange={(e) =>
                                            handlePriceCopChange(
                                                'purchase_price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <p className="text-right text-[9px] text-zinc-400">
                                        Base: $
                                        {Number(data.purchase_price).toFixed(4)}{' '}
                                        USD
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="selling_price_cop"
                                        className="font-bold text-blue-600 dark:text-blue-400"
                                    >
                                        Precio Venta (COP)
                                    </Label>
                                    <Input
                                        id="selling_price_cop"
                                        type="number"
                                        step="any"
                                        className="border-blue-200 bg-white font-bold text-blue-700 dark:bg-zinc-900 dark:text-blue-300"
                                        value={data.selling_price_cop}
                                        onChange={(e) =>
                                            handlePriceCopChange(
                                                'selling_price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <p className="text-right text-[9px] text-blue-400/80">
                                        Base: $
                                        {Number(data.selling_price).toFixed(4)}{' '}
                                        USD
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                {editingProduct
                                    ? 'Guardar Cambios'
                                    : 'Crear Producto'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
