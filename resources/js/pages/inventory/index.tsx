import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    Package,
    MoreVertical,
    Edit,
    Trash2,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function InventoryIndex({ products, exchangeRates }: { products: Product[], exchangeRates: Record<string, number> }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const copRate = exchangeRates.COP || 3650;

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
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

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
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
        setData({
            name: product.name,
            description: product.description || '',
            sku: product.sku || '',
            purchase_price: p_usd,
            selling_price: s_usd,
            stock: product.stock,
            purchase_price_cop: p_usd * copRate,
            selling_price_cop: s_usd * copRate,
        });
        setIsDialogOpen(true);
    };

    const handlePriceCopChange = (field: 'purchase_price' | 'selling_price', copValue: string) => {
        const val = parseFloat(copValue) || 0;
        setData(prev => ({
            ...prev,
            [`${field}_cop`]: val,
            [field]: val / copRate
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

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Gestión de Inventario</h1>
                        <p className="text-muted-foreground text-sm mt-1">Administra tus productos, precios y existencias en tiempo real.</p>
                    </div>

                    <Button onClick={openCreateDialog} size="lg" className="gap-2 px-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-all bg-indigo-600 hover:bg-indigo-700 border-none font-black uppercase tracking-widest text-[11px]">
                        <Plus className="h-4 w-4" />
                        Nuevo Producto
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Inventory Value - Highlighted */}
                    <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-200 opacity-80">Valor en Almacén (COP)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight mb-1">
                                {Number(products.reduce((acc: number, p: Product) => acc + (p.stock * Number(p.purchase_price)), 0) * copRate).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-emerald-100 font-bold opacity-90">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Costo total proyectado</span>
                            </div>
                        </CardContent>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp size={80} />
                        </div>
                    </Card>

                    {/* Total Catalog */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-indigo-500">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Catálogo Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{products.length}</span>
                                <Package className="h-5 w-5 text-indigo-400" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Artículos distintos</p>
                        </CardContent>
                    </Card>

                    {/* Stock Alerts */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-orange-500">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Alertas Críticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{products.filter(p => p.stock < 10).length}</span>
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Menos de 10 unidades</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar por nombre o SKU..."
                            className="pl-10 h-10 rounded-xl border-dashed focus-visible:ring-indigo-500/30 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-900 overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                <th className="h-12 px-6 text-left align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Producto / Info</th>
                                <th className="h-12 px-6 text-left align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Identificador</th>
                                <th className="h-12 px-6 text-center align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Estado Stock</th>
                                <th className="h-12 px-6 text-right align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Venta (COP)</th>
                                <th className="h-12 px-6 text-right align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Eq. USD</th>
                                <th className="h-12 px-6 text-right align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Ctrl</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                    <td className="p-4 px-6 align-middle">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{product.name}</div>
                                        <div className="text-[10px] font-medium text-muted-foreground line-clamp-1 uppercase tracking-tight mt-0.5">{product.description || 'Sin descripción'}</div>
                                    </td>
                                    <td className="p-4 px-6 align-middle">
                                        <code className="text-[11px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                                            {product.sku || 'N/A'}
                                        </code>
                                    </td>
                                    <td className="p-4 px-6 align-middle text-center">
                                        <Badge className={`font-black text-[10px] border-none px-2 h-6 rounded-md ${product.stock < 10
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}>
                                            {product.stock} UNI.
                                        </Badge>
                                    </td>
                                    <td className="p-4 px-6 align-middle text-right">
                                        <div className="text-base font-black text-green-600 dark:text-green-400">
                                            {(Number(product.selling_price) * copRate).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 align-middle text-right text-[11px] font-mono font-bold text-muted-foreground">
                                        ${Number(product.selling_price).toFixed(2)}
                                    </td>
                                    <td className="p-4 px-6 align-middle text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                                                <DropdownMenuItem onClick={() => openEditDialog(product)} className="gap-2 font-bold text-xs p-2.5">
                                                    <Edit className="h-4 w-4 text-indigo-500" /> Editar Producto
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(product.id)}
                                                    className="gap-2 font-bold text-xs p-2.5 text-red-500 focus:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Eliminar Permanente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="p-20 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                            <Search className="h-10 w-10 opacity-10" />
                            <p className="text-sm font-medium">No se encontraron productos en el almacén</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        <DialogDescription>
                            Ingresa los precios en **Pesos Colombianos (COP)**. El sistema calculará automáticamente la base en dólares.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU / Código</Label>
                                <Input
                                    id="sku"
                                    value={data.sku}
                                    onChange={e => setData('sku', e.target.value)}
                                />
                                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="stock">Stock / Existencias</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={data.stock}
                                    onChange={e => setData('stock', parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2 text-blue-600 dark:text-blue-400">
                                    <Label htmlFor="purchase_price_cop">Costo (COP)</Label>
                                    <Input
                                        id="purchase_price_cop"
                                        type="number"
                                        value={data.purchase_price_cop}
                                        onChange={e => handlePriceCopChange('purchase_price', e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">Eq. USD: ${Number(data.purchase_price).toFixed(2)}</p>
                                </div>
                                <div className="grid gap-2 text-green-600 dark:text-green-400">
                                    <Label htmlFor="selling_price_cop">Venta (COP)</Label>
                                    <Input
                                        id="selling_price_cop"
                                        type="number"
                                        value={data.selling_price_cop}
                                        onChange={e => handlePriceCopChange('selling_price', e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">Eq. USD: ${Number(data.selling_price).toFixed(2)}</p>
                                    {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
