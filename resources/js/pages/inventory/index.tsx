import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Edit,
    MoreVertical,
    Package,
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

interface Product {
    id: number;
    name: string;
    description: string | null;
    sku: string | null;
    purchase_price: number;
    selling_price: number;
    stock: number;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventario',
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

    const copRate = exchangeRates.COP || 3650;

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
        // UI Helpers
        purchase_price_cop: 0,
        selling_price_cop: 0,
    });

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const openCreateDialog = () => {
        setEditingProduct(null);
        reset();
        setIsDialogOpen(true);
    };

    const openEditDialog = (product: Product) => {
        setEditingProduct(product);
        const p_usd = Number(product.purchase_price);
        const s_usd = Number(product.selling_price);

        // Al editar, recalculamos el COP basándonos en el USD preciso
        // Usamos Math.round para que al abrir el modal se vea "2000" y no "2000.05"
        setData({
            name: product.name,
            description: product.description || '',
            sku: product.sku || '',
            purchase_price: p_usd,
            selling_price: s_usd,
            stock: product.stock,
            purchase_price_cop: Math.round(p_usd * copRate),
            selling_price_cop: Math.round(s_usd * copRate),
        });
        setIsDialogOpen(true);
    };

    const handlePriceCopChange = (
        field: 'purchase_price' | 'selling_price',
        copValue: string,
    ) => {
        // Permitimos decimales en el input por si acaso, aunque en COP usualmente es entero
        const val = parseFloat(copValue) || 0;

        setData((prev) => ({
            ...prev,
            [`${field}_cop`]: val,
            // Aquí guardamos el valor con ALTA precisión en el estado (sin redondear a 2 decimales todavía)
            // Esto se enviará al backend, que ahora soporta 6 decimales.
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
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                            Gestión de Inventario
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Administra tus productos, precios y existencias en
                            tiempo real.
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

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Inventory Value - Highlighted */}
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-emerald-200 uppercase opacity-80">
                                Valor en Almacén (COP)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-black tracking-tight">
                                {Math.round(
                                    products.reduce(
                                        (acc: number, p: Product) =>
                                            acc +
                                            p.stock * Number(p.purchase_price),
                                        0,
                                    ) * copRate,
                                ).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-100 opacity-90">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Costo total proyectado</span>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp size={80} />
                        </div>
                    </Card>

                    {/* Total Catalog */}
                    <Card className="border-l-4 border-none border-l-indigo-500 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                Catálogo Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                                    {products.length}
                                </span>
                                <Package className="h-5 w-5 text-indigo-400" />
                            </div>
                            <p className="mt-1 text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
                                Artículos distintos
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stock Alerts */}
                    <Card className="border-l-4 border-none border-l-orange-500 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black tracking-widest text-orange-600 uppercase dark:text-orange-400">
                                Alertas Críticas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                                    {
                                        products.filter((p) => p.stock < 10)
                                            .length
                                    }
                                </span>
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="mt-1 text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
                                Menos de 10 unidades
                            </p>
                        </CardContent>
                    </Card>
                </div>

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
                </div>

                <div className="overflow-x-auto rounded-2xl border-none bg-white shadow-xl dark:bg-zinc-900">
                    <table className="w-full min-w-[800px] text-sm">
                        <thead>
                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                <th className="h-12 px-6 text-left align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Producto / Info
                                </th>
                                <th className="h-12 px-6 text-left align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Identificador
                                </th>
                                <th className="h-12 px-6 text-center align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Estado Stock
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Venta (COP)
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Eq. USD
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Ctrl
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                >
                                    <td className="p-4 px-6 align-middle">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {product.name}
                                        </div>
                                        <div className="mt-0.5 line-clamp-1 text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
                                            {product.description ||
                                                'Sin descripción'}
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 align-middle">
                                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                            {product.sku || 'N/A'}
                                        </code>
                                    </td>
                                    <td className="p-4 px-6 text-center align-middle">
                                        <Badge
                                            className={`h-6 rounded-md border-none px-2 text-[10px] font-black ${
                                                product.stock < 10
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}
                                        >
                                            {product.stock} UNI.
                                        </Badge>
                                    </td>
                                    <td className="p-4 px-6 text-right align-middle">
                                        <div className="text-base font-black text-green-600 dark:text-green-400">
                                            {/* Usamos Math.round aquí para mostrar el precio "cerrado" sin decimales raros */}
                                            {Math.round(
                                                Number(product.selling_price) *
                                                    copRate,
                                            ).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 text-right align-middle font-mono text-[11px] font-bold text-muted-foreground">
                                        {/* Mostramos 6 decimales en el tooltip si es necesario, pero 2 visualmente esta bien */}
                                        $
                                        {Number(product.selling_price).toFixed(
                                            2,
                                        )}
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
                                                        openEditDialog(product)
                                                    }
                                                    className="gap-2 p-2.5 text-xs font-bold"
                                                >
                                                    <Edit className="h-4 w-4 text-indigo-500" />{' '}
                                                    Editar Producto
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDelete(product.id)
                                                    }
                                                    className="gap-2 p-2.5 text-xs font-bold text-red-500 focus:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />{' '}
                                                    Eliminar Permanente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center gap-3 p-20 text-center text-muted-foreground italic">
                            <Search className="h-10 w-10 opacity-10" />
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
                            Ingresa los precios en **Pesos Colombianos (COP)**.
                            El sistema calculará automáticamente la base en
                            dólares.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
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
                                <Label htmlFor="description">Descripción</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="stock">
                                    Stock / Existencias
                                </Label>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2 text-blue-600 dark:text-blue-400">
                                    <Label htmlFor="purchase_price_cop">
                                        Costo (COP)
                                    </Label>
                                    <Input
                                        id="purchase_price_cop"
                                        type="number"
                                        value={data.purchase_price_cop}
                                        onChange={(e) =>
                                            handlePriceCopChange(
                                                'purchase_price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {/* Mostramos 4 decimales para depuración visual, aunque el usuario vea 2000 COP */}
                                    <p className="text-[10px] text-muted-foreground">
                                        Eq. USD: $
                                        {Number(data.purchase_price).toFixed(4)}
                                    </p>
                                </div>
                                <div className="grid gap-2 text-green-600 dark:text-green-400">
                                    <Label htmlFor="selling_price_cop">
                                        Venta (COP)
                                    </Label>
                                    <Input
                                        id="selling_price_cop"
                                        type="number"
                                        value={data.selling_price_cop}
                                        onChange={(e) =>
                                            handlePriceCopChange(
                                                'selling_price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Eq. USD: $
                                        {Number(data.selling_price).toFixed(4)}
                                    </p>
                                    {errors.selling_price && (
                                        <p className="text-xs text-destructive">
                                            {errors.selling_price}
                                        </p>
                                    )}
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
