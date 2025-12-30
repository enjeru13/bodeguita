import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Search,
    Users,
    MoreVertical,
    Edit,
    Trash2,
    UserPlus,
    Mail,
    Phone,
    MapPin
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

export default function CustomersIndex({ customers }: { customers: Customer[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        identity_document: '',
    });

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.identity_document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Comunidad de Clientes</h1>
                        <p className="text-muted-foreground text-sm mt-1">Gestiona la base de datos de tus clientes y sus perfiles de contacto.</p>
                    </div>

                    <Button onClick={openCreateDialog} size="lg" className="gap-2 px-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-all bg-indigo-600 hover:bg-indigo-700 border-none font-black uppercase tracking-widest text-[11px]">
                        <UserPlus className="h-4 w-4" />
                        Registrar Cliente
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Total Customers Card */}
                    <Card className="border-none shadow-md bg-white dark:bg-zinc-900 border-l-4 border-l-indigo-600">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 text-left">Base de Datos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{customers.length}</span>
                                <Users className="h-5 w-5 text-indigo-400" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Clientes registrados</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar por nombre, documento o email..."
                            className="pl-10 h-10 rounded-xl border-dashed focus-visible:ring-indigo-500/30 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-900 overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                        <thead>
                            <tr className="border-b bg-zinc-50/50 dark:bg-zinc-800/50">
                                <th className="h-12 px-6 text-left align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Cliente / Ubicación</th>
                                <th className="h-12 px-6 text-left align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Identificación</th>
                                <th className="h-12 px-6 text-left align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Medios de Contacto</th>
                                <th className="h-12 px-6 text-right align-middle font-black text-[10px] uppercase tracking-widest text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                    <td className="p-4 px-6 align-middle">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                                        <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 uppercase tracking-tight mt-0.5">
                                            <MapPin className="h-3 w-3" /> {customer.address || 'Sin dirección registrada'}
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 align-middle">
                                        <code className="text-[11px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                                            {customer.identity_document || 'N/A'}
                                        </code>
                                    </td>
                                    <td className="p-4 px-6 align-middle">
                                        <div className="flex flex-col gap-1">
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                                    <Mail className="h-3 w-3 text-zinc-400" /> {customer.email}
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                                    <Phone className="h-3 w-3 text-zinc-400" /> {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 align-middle text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                                                <DropdownMenuItem onClick={() => openEditDialog(customer)} className="gap-2 font-bold text-xs p-2.5">
                                                    <Edit className="h-4 w-4 text-indigo-500" /> Editar Perfil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(customer.id)}
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
                    {filteredCustomers.length === 0 && (
                        <div className="p-20 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                            <Users className="h-10 w-10 opacity-10" />
                            <p className="text-sm font-medium">No se encontraron clientes en la base de datos</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                        <DialogDescription>
                            Registra o actualiza la información del cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="identity_document">Documento de Identidad (DNI/CI/RIF)</Label>
                                <Input
                                    id="identity_document"
                                    value={data.identity_document}
                                    onChange={e => setData('identity_document', e.target.value)}
                                />
                                {errors.identity_document && <p className="text-xs text-destructive">{errors.identity_document}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
