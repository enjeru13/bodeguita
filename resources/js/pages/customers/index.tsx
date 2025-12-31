import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    CreditCard,
    Edit,
    MoreVertical,
    Phone,
    Search,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    identity_document: string | null;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clientes',
        href: '/customers',
    },
];

export default function CustomersIndex({
    customers,
}: {
    customers: Customer[];
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null,
    );

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
        email: '', // Se mantiene en el estado por compatibilidad, pero no se pide
        phone: '',
        address: '', // Se mantiene en el estado por compatibilidad, pero no se pide
        identity_document: '',
    });

    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.identity_document
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const openCreateDialog = () => {
        setEditingCustomer(null);
        reset();
        setIsDialogOpen(true);
    };

    const openEditDialog = (customer: Customer) => {
        setEditingCustomer(customer);
        setData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            identity_document: customer.identity_document || '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer) {
            put(`/customers/${editingCustomer.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Cliente actualizado correctamente');
                },
                onError: () => toast.error('Error al actualizar el cliente'),
            });
        } else {
            post('/customers', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success('Cliente registrado correctamente');
                },
                onError: () => toast.error('Error al registrar el cliente'),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            destroy(`/customers/${id}`, {
                onSuccess: () => toast.success('Cliente eliminado'),
                onError: () => toast.error('Error al eliminar el cliente'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clientes" />

            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                            Comunidad de Clientes
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestiona la base de datos de tus clientes.
                        </p>
                    </div>

                    <Button
                        onClick={openCreateDialog}
                        size="lg"
                        className="gap-2 rounded-2xl border-none bg-indigo-600 px-6 text-[11px] font-black tracking-widest uppercase shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700"
                    >
                        <UserPlus className="h-4 w-4" />
                        Registrar Cliente
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Total Customers Card */}
                    <Card className="border-l-4 border-none border-l-indigo-600 bg-white shadow-md dark:bg-zinc-900">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-left text-[10px] font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                Base de Datos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">
                                    {customers.length}
                                </span>
                                <Users className="h-5 w-5 text-indigo-400" />
                            </div>
                            <p className="mt-1 text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
                                Clientes registrados
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="Buscar por nombre o cédula..."
                            className="h-10 rounded-xl border-dashed pl-10 font-medium transition-all focus-visible:ring-indigo-500/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border-none bg-white shadow-xl dark:bg-zinc-900">
                    <table className="w-full min-w-[600px] text-sm">
                        <thead>
                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                <th className="h-12 px-6 text-left align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Nombre y Apellidos
                                </th>
                                <th className="h-12 px-6 text-left align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Cédula
                                </th>
                                <th className="h-12 px-6 text-left align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Teléfono
                                </th>
                                <th className="h-12 px-6 text-right align-middle text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredCustomers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                >
                                    <td className="p-4 px-6 align-middle">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {customer.name}
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 align-middle">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-3 w-3 text-zinc-400" />
                                            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                {customer.identity_document ||
                                                    '---'}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 align-middle">
                                        {customer.phone ? (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                                <Phone className="h-3 w-3 text-zinc-400" />{' '}
                                                {customer.phone}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground italic">
                                                Sin teléfono
                                            </span>
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
                                                        openEditDialog(customer)
                                                    }
                                                    className="gap-2 p-2.5 text-xs font-bold"
                                                >
                                                    <Edit className="h-4 w-4 text-indigo-500" />{' '}
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDelete(
                                                            customer.id,
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
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <div className="flex flex-col items-center gap-3 p-20 text-center text-muted-foreground italic">
                            <Users className="h-10 w-10 opacity-10" />
                            <p className="text-sm font-medium">
                                No se encontraron clientes
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomer
                                ? 'Editar Cliente'
                                : 'Nuevo Cliente'}
                        </DialogTitle>
                        <DialogDescription>
                            Solo el nombre es obligatorio. Los demás campos son
                            opcionales.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {/* Nombre - Obligatorio */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Nombre y Apellidos{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                    placeholder="Ej. Juan Pérez"
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Cédula - Opcional */}
                            <div className="grid gap-2">
                                <Label htmlFor="identity_document">
                                    Cédula (Opcional)
                                </Label>
                                <Input
                                    id="identity_document"
                                    value={data.identity_document}
                                    onChange={(e) =>
                                        setData(
                                            'identity_document',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="V-12345678"
                                />
                                {errors.identity_document && (
                                    <p className="text-xs text-destructive">
                                        {errors.identity_document}
                                    </p>
                                )}
                            </div>

                            {/* Teléfono - Opcional */}
                            <div className="grid gap-2">
                                <Label htmlFor="phone">
                                    Número de Teléfono (Opcional)
                                </Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="0414-1234567"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                {editingCustomer
                                    ? 'Guardar Cambios'
                                    : 'Registrar Cliente'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
